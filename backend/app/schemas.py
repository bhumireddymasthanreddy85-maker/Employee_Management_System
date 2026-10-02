from __future__ import annotations

import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class AccountCreate(BaseModel):
    email: EmailStr
    temporary_password: str = Field(..., min_length=8)
    role: Literal["admin", "user"]


class UserRegistrationRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @model_validator(mode="after")
    def passwords_must_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self


class AdminRegistrationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)


class AccountCreated(BaseModel):
    id: str
    email: EmailStr
    role: Literal["admin", "user"]


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: Literal["admin", "user"] = "user"
    must_change_password: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    phone_number: str = Field(..., min_length=7)
    department: str = Field(..., min_length=1)
    designation: str = Field(..., min_length=1)
    joining_date: date
    salary: float = Field(..., gt=0)
    status: Literal["Active", "Inactive"]


class EmployeeInput(EmployeeBase):
    @field_validator("email")
    @classmethod
    def validate_gmail_address(cls, value: EmailStr) -> EmailStr:
        if re.fullmatch(r"[^@\s]+@gmail\.com", str(value), re.IGNORECASE) is None:
            raise ValueError("Email must be a Gmail address ending in @gmail.com")
        return value

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        if re.fullmatch(r"[0-9]{10}", value) is None:
            raise ValueError("Phone number must contain exactly 10 digits")
        return value


class EmployeeCreate(EmployeeInput):
    pass


class EmployeeUpdate(EmployeeInput):
    employee_id: str | None = None


class EmployeeRecord(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    employee_id: str


class EmployeePage(BaseModel):
    items: list[EmployeeRecord]
    total: int
    page: int
    limit: int


class DashboardStats(BaseModel):
    total_employees: int
    active_employees: int
    inactive_employees: int
