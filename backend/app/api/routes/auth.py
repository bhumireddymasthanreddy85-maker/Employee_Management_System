from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.api.dependencies import get_current_admin_user, get_current_user
from app.schemas import (
    AccountCreate,
    AccountCreated,
    ChangePasswordRequest,
    AdminRegistrationRequest,
    LoginRequest,
    TokenResponse,
    UserRegistrationRequest,
)
from app.services.auth_service import (
    change_password as change_user_password,
    create_account,
    login as login_user,
    register_first_admin,
    register_user,
)

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    return login_user(payload.email, payload.password)


@router.post("/auth/register/user", response_model=AccountCreated, status_code=status.HTTP_201_CREATED)
def register_employee_user(payload: UserRegistrationRequest):
    try:
        return register_user(payload.first_name, payload.last_name, payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc


@router.post("/auth/register/admin", response_model=AccountCreated, status_code=status.HTTP_201_CREATED)
def register_initial_admin(payload: AdminRegistrationRequest):
    try:
        return register_first_admin(payload.name, payload.email, payload.password)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc


@router.post("/auth/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user=Depends(get_current_user),
):
    change_user_password(current_user, payload.current_password, payload.new_password)
    return {"message": "Password changed successfully"}


@router.post("/admin/accounts", response_model=AccountCreated, status_code=status.HTTP_201_CREATED)
def register_account(payload: AccountCreate, current_user=Depends(get_current_admin_user)):
    try:
        return create_account(payload.email, payload.temporary_password, payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc
