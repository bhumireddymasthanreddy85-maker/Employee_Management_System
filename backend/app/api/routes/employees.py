from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_current_admin_user, get_current_user
from app.schemas import EmployeeCreate, EmployeePage, EmployeeRecord, EmployeeUpdate
from app.services import employee_service
from app.services.employee_service import DuplicateEmployeeEmailError, EmployeeNotFoundError

router = APIRouter(prefix="/api", tags=["employees"])


@router.get("/employees", response_model=EmployeePage)
def list_employees(
    current_user=Depends(get_current_admin_user),
    search: str | None = Query(default=None),
    department: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort_by: Literal["employee_id_asc", "employee_id_desc", "name_asc", "salary_desc"] = Query(
        default="employee_id_asc"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    status = status or None
    if status not in {None, "Active", "Inactive"}:
        raise HTTPException(status_code=422, detail="Status must be Active or Inactive")
    result = employee_service.list_employees(search, department, status, sort_by, page, limit)
    result["items"] = [EmployeeRecord(**employee) for employee in result["items"]]
    return EmployeePage(**result)


@router.get("/employees/departments", response_model=list[str])
def list_departments(current_user=Depends(get_current_admin_user)):
    return employee_service.list_departments()


@router.get("/employees/me", response_model=EmployeeRecord)
def get_my_employee(current_user=Depends(get_current_user)):
    if current_user.get("role") != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for employee accounts",
        )
    employee_record_id = current_user.get("employee_record_id")
    if not employee_record_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No employee profile is linked to this account",
        )
    try:
        employee = employee_service.get_employee(employee_record_id)
    except EmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found") from exc
    return EmployeeRecord(**employee)


@router.post("/employees", response_model=EmployeeRecord, status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate, current_user=Depends(get_current_admin_user)):
    try:
        created = employee_service.create_employee(employee.model_dump(mode="json"))
    except DuplicateEmployeeEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee email already exists") from exc
    return EmployeeRecord(**created)


@router.get("/employees/{employee_id}", response_model=EmployeeRecord)
def get_employee(employee_id: str, current_user=Depends(get_current_admin_user)):
    try:
        employee = employee_service.get_employee(employee_id)
    except EmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
    return EmployeeRecord(**employee)


@router.put("/employees/{employee_id}", response_model=EmployeeRecord)
def update_employee(employee_id: str, employee: EmployeeUpdate, current_user=Depends(get_current_admin_user)):
    try:
        updated = employee_service.update_employee(employee_id, employee.model_dump(mode="json"))
    except EmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
    except DuplicateEmployeeEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee email already exists") from exc
    return EmployeeRecord(**updated)


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, current_user=Depends(get_current_admin_user)):
    try:
        employee_service.delete_employee(employee_id)
    except EmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
    return None
