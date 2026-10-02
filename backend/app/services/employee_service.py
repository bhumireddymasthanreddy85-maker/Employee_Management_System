from typing import Any

from pymongo.errors import DuplicateKeyError

from app.db.mongo import db_manager


class EmployeeNotFoundError(Exception):
    pass


class DuplicateEmployeeEmailError(Exception):
    pass


def list_employees(
    search: str | None,
    department: str | None,
    status: str | None,
    sort_by: str,
    page: int,
    limit: int,
) -> dict[str, Any]:
    filters = {"search": search, "department": department, "status": status}
    return {
        "items": db_manager.get_employees(
            **filters,
            sort_by=sort_by,
            skip=(page - 1) * limit,
            limit=limit,
        ),
        "total": db_manager.count_employees(**filters),
        "page": page,
        "limit": limit,
    }


def list_departments() -> list[str]:
    return db_manager.get_departments()


def get_employee(employee_id: str) -> dict[str, Any]:
    employee = db_manager.get_employee_by_id(employee_id)
    if employee is None:
        raise EmployeeNotFoundError
    return employee


def create_employee(employee_data: dict[str, Any]) -> dict[str, Any]:
    payload = {**employee_data, "email": employee_data["email"].strip().lower()}
    if db_manager.get_employee_by_email(payload["email"]):
        raise DuplicateEmployeeEmailError
    try:
        return db_manager.create_employee(payload)
    except DuplicateKeyError as exc:
        raise DuplicateEmployeeEmailError from exc


def update_employee(employee_id: str, employee_data: dict[str, Any]) -> dict[str, Any]:
    existing = get_employee(employee_id)
    payload = {**employee_data, "email": employee_data["email"].strip().lower()}
    matching_email = db_manager.get_employee_by_email(payload["email"])
    if matching_email and str(matching_email["_id"]) != existing["id"]:
        raise DuplicateEmployeeEmailError

    try:
        updated = db_manager.update_employee(employee_id, payload)
    except DuplicateKeyError as exc:
        raise DuplicateEmployeeEmailError from exc
    if updated is None:
        raise EmployeeNotFoundError
    return updated


def delete_employee(employee_id: str) -> None:
    if not db_manager.delete_employee(employee_id):
        raise EmployeeNotFoundError

