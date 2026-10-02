from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import db_manager
from app.schemas import TokenResponse, UserResponse


def find_user_by_email(email: str) -> dict | None:
    return db_manager.get_user_by_email(email.lower())


def login(email: str, password: str) -> TokenResponse:
    user = find_user_by_email(email)
    if user is None or not verify_password(password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    role = user.get("role", "user")
    token = create_access_token({"sub": user["email"], "role": role})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.get("id", user.get("_id", "unknown"))),
            email=user["email"],
            role=role,
            must_change_password=user.get("must_change_password", False),
        ),
    )


def create_account(email: str, temporary_password: str, role: str) -> dict[str, str]:
    normalized_email = email.strip().lower()
    employee_record_id = None
    if role == "user":
        employee = db_manager.get_employee_by_email(normalized_email)
        if employee is None:
            raise ValueError("A User account must use the email of an existing employee")
        employee_record_id = str(employee["_id"])

    if find_user_by_email(normalized_email):
        raise DuplicateKeyError("An account with this email already exists")

    created = db_manager.create_user(
        normalized_email,
        hash_password(temporary_password),
        role,
        employee_record_id=employee_record_id,
        must_change_password=True,
    )
    return {
        "id": str(created["id"]),
        "email": created["email"],
        "role": created["role"],
    }


def register_user(first_name: str, last_name: str, email: str, password: str) -> dict[str, str]:
    normalized_email = email.strip().lower()
    employee = db_manager.get_employee_by_email(normalized_email)
    if employee is None:
        raise ValueError("Registration requires the email address of an existing employee")
    if (
        employee["first_name"].strip().casefold() != first_name.strip().casefold()
        or employee["last_name"].strip().casefold() != last_name.strip().casefold()
    ):
        raise ValueError("First and last name must match the employee record")
    if find_user_by_email(normalized_email):
        raise DuplicateKeyError("An account with this email already exists")

    created = db_manager.create_user(
        normalized_email,
        hash_password(password),
        role="user",
        employee_record_id=str(employee["_id"]),
        name=f"{first_name.strip()} {last_name.strip()}",
    )
    return {"id": str(created["id"]), "email": created["email"], "role": created["role"]}


def register_first_admin(name: str, email: str, password: str) -> dict[str, str]:
    if db_manager._require_db()["users"].count_documents({"role": "admin"}) > 0:
        raise PermissionError("Admin registration is closed. Ask an existing Admin to create the account.")
    normalized_email = email.strip().lower()
    if find_user_by_email(normalized_email):
        raise DuplicateKeyError("An account with this email already exists")

    try:
        db_manager.claim_first_admin_registration()
    except DuplicateKeyError as exc:
        raise PermissionError("Admin registration is closed. Ask an existing Admin to create the account.") from exc

    try:
        created = db_manager.create_user(
            normalized_email,
            hash_password(password),
            role="admin",
            name=name.strip(),
        )
    except Exception:
        db_manager.release_first_admin_registration()
        raise
    return {"id": str(created["id"]), "email": created["email"], "role": created["role"]}


def change_password(user: dict, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user["password"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if current_password == new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )
    db_manager.update_user_password(user["_id"], hash_password(new_password))