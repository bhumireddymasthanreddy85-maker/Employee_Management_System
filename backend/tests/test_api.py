from datetime import datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pymongo.errors import ConnectionFailure

from app.db import mongo
from app.db.mongo import db_manager



def get_auth_token(client: TestClient) -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@company.com", "password": "admin123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_login_success(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@company.com", "password": "admin123"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"


def test_login_rejects_invalid_credentials(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@company.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_public_user_registration_links_existing_employee(client: TestClient) -> None:
    invalid_identity = client.post(
        "/api/auth/register/user",
        json={
            "first_name": "Wrong",
            "last_name": "Name",
            "email": "john.smith@gmail.com",
            "password": "EmployeePass456",
            "confirm_password": "EmployeePass456",
        },
    )
    assert invalid_identity.status_code == 400

    registration = client.post(
        "/api/auth/register/user",
        json={
            "first_name": "John",
            "last_name": "Smith",
            "email": "john.smith@gmail.com",
            "password": "EmployeePass456",
            "confirm_password": "EmployeePass456",
        },
    )
    assert registration.status_code == 201, registration.text
    assert registration.json()["role"] == "user"
    assert "password" not in registration.json()

    login_response = client.post(
        "/api/auth/login",
        json={"email": "john.smith@gmail.com", "password": "EmployeePass456"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["must_change_password"] is False
    user_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
    profile = client.get("/api/employees/me", headers=user_headers)
    assert profile.status_code == 200
    assert profile.json()["employee_id"] == "EMP-1001"
    assert client.get("/api/employees", headers=user_headers).status_code == 403

    mismatch = client.post(
        "/api/auth/register/user",
        json={
            "first_name": "Emma",
            "last_name": "Jones",
            "email": "john.smith@gmail.com",
            "password": "EmployeePass456",
            "confirm_password": "DifferentPass456",
        },
    )
    assert mismatch.status_code == 422


def test_public_admin_registration_is_closed_when_admin_exists(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register/admin",
        json={
            "name": "Another Admin",
            "email": "another.admin@gmail.com",
            "password": "AdminPassword456",
        },
    )
    assert response.status_code == 403


def test_first_admin_can_register_before_login(client: TestClient) -> None:
    users = db_manager._require_db()["users"]
    locks = db_manager._require_db()["admin_registration_lock"]
    existing_admins = list(users.find({"role": "admin"}))
    users.delete_many({"role": "admin"})
    locks.delete_one({"_id": "first_admin"})

    try:
        registration = client.post(
            "/api/auth/register/admin",
            json={
                "name": "First Administrator",
                "email": "first.admin@example.com",
                "password": "AdminPassword456",
            },
        )
        assert registration.status_code == 201, registration.text
        assert registration.json()["role"] == "admin"

        login_response = client.post(
            "/api/auth/login",
            json={"email": "first.admin@example.com", "password": "AdminPassword456"},
        )
        assert login_response.status_code == 200
        assert login_response.json()["user"]["must_change_password"] is False

        second_registration = client.post(
            "/api/auth/register/admin",
            json={
                "name": "Second Administrator",
                "email": "second.admin@example.com",
                "password": "AdminPassword456",
            },
        )
        assert second_registration.status_code == 403
    finally:
        users.delete_many({"role": "admin"})
        if existing_admins:
            users.insert_many(existing_admins)
        locks.delete_one({"_id": "first_admin"})


def test_admin_creates_user_account_with_own_profile_access(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {get_auth_token(client)}"}
    create_response = client.post(
        "/api/admin/accounts",
        json={
            "email": "emma.jones@gmail.com",
            "temporary_password": "TemporaryPass123",
            "role": "user",
        },
        headers=admin_headers,
    )
    assert create_response.status_code == 201, create_response.text
    assert create_response.json()["role"] == "user"
    assert "password" not in create_response.json()

    login_response = client.post(
        "/api/auth/login",
        json={"email": "emma.jones@gmail.com", "password": "TemporaryPass123"},
    )
    assert login_response.status_code == 200
    user_token = login_response.json()["access_token"]
    assert login_response.json()["user"]["must_change_password"] is True
    user_headers = {"Authorization": f"Bearer {user_token}"}

    assert client.get("/api/employees/me", headers=user_headers).status_code == 403
    change_response = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "TemporaryPass123",
            "new_password": "EmployeePass456",
        },
        headers=user_headers,
    )
    assert change_response.status_code == 200

    login_with_new_password = client.post(
        "/api/auth/login",
        json={"email": "emma.jones@gmail.com", "password": "EmployeePass456"},
    )
    assert login_with_new_password.status_code == 200
    user_headers = {"Authorization": f"Bearer {login_with_new_password.json()['access_token']}"}

    own_profile = client.get("/api/employees/me", headers=user_headers)
    assert own_profile.status_code == 200
    assert own_profile.json()["employee_id"] == "EMP-1002"

    assert client.get("/api/employees", headers=user_headers).status_code == 403
    assert client.get("/api/employees/departments", headers=user_headers).status_code == 403
    assert client.get("/api/dashboard/stats", headers=user_headers).status_code == 403
    assert client.post(
        "/api/admin/accounts",
        json={
            "email": "another.admin@gmail.com",
            "temporary_password": "TemporaryPass123",
            "role": "admin",
        },
        headers=user_headers,
    ).status_code == 403
    db_manager._require_db()["users"].delete_one({"email": "emma.jones@gmail.com"})


def test_admin_can_create_admin_account(client: TestClient) -> None:
    admin_headers = {"Authorization": f"Bearer {get_auth_token(client)}"}
    created = client.post(
        "/api/admin/accounts",
        json={
            "email": "second.admin@example.com",
            "temporary_password": "AdminTempPass123",
            "role": "admin",
        },
        headers=admin_headers,
    )
    assert created.status_code == 201, created.text
    assert created.json()["role"] == "admin"

    login_response = client.post(
        "/api/auth/login",
        json={"email": "second.admin@example.com", "password": "AdminTempPass123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["must_change_password"] is True


def test_admin_account_creation_requires_admin_and_existing_employee_for_user(
    client: TestClient,
) -> None:
    payload = {
        "email": "unknown.employee@gmail.com",
        "temporary_password": "TemporaryPass123",
        "role": "user",
    }
    assert client.post("/api/admin/accounts", json=payload).status_code == 401

    admin_headers = {"Authorization": f"Bearer {get_auth_token(client)}"}
    missing_employee = client.post("/api/admin/accounts", json=payload, headers=admin_headers)
    assert missing_employee.status_code == 404

    created = client.post(
        "/api/admin/accounts",
        json={
            **payload,
            "email": "emma.jones@gmail.com",
        },
        headers=admin_headers,
    )
    assert created.status_code == 201

    duplicate = client.post(
        "/api/admin/accounts",
        json={
            **payload,
            "email": "EMMA.JONES@gmail.com",
        },
        headers=admin_headers,
    )
    assert duplicate.status_code == 409
    db_manager._require_db()["users"].delete_one({"email": "emma.jones@gmail.com"})


def test_dashboard_stats(client: TestClient) -> None:
    token = get_auth_token(client)
    response = client.get("/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    stats = response.json()
    assert stats == {
        "total_employees": 2,
        "active_employees": 1,
        "inactive_employees": 1,
    }


def test_employee_routes_require_authentication(client: TestClient) -> None:
    response = client.get("/api/employees")
    assert response.status_code == 401


def test_employee_search_filter_and_server_pagination(client: TestClient) -> None:
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    filtered_response = client.get(
        "/api/employees",
        params={"search": "Emma", "department": "Human Resources", "status": "Inactive"},
        headers=headers,
    )
    assert filtered_response.status_code == 200
    filtered = filtered_response.json()
    assert filtered["total"] == 1
    assert filtered["items"][0]["email"] == "emma.jones@gmail.com"

    full_name_response = client.get(
        "/api/employees",
        params={"search": "John Smith"},
        headers=headers,
    )
    assert full_name_response.status_code == 200
    assert full_name_response.json()["items"][0]["employee_id"] == "EMP-1001"

    sort_expectations = [
        ("employee_id_asc", "EMP-1001"),
        ("employee_id_desc", "EMP-1002"),
        ("name_asc", "EMP-1002"),
        ("salary_desc", "EMP-1001"),
    ]
    for sort_by, expected_employee_id in sort_expectations:
        sorted_response = client.get(
            "/api/employees",
            params={"sort_by": sort_by},
            headers=headers,
        )
        assert sorted_response.status_code == 200
        assert sorted_response.json()["items"][0]["employee_id"] == expected_employee_id

    invalid_sort_response = client.get(
        "/api/employees",
        params={"sort_by": "salary_asc"},
        headers=headers,
    )
    assert invalid_sort_response.status_code == 422

    departments_response = client.get("/api/employees/departments", headers=headers)
    assert departments_response.status_code == 200
    assert departments_response.json() == ["Engineering", "Human Resources"]

    second_page_response = client.get(
        "/api/employees",
        params={"page": 2, "limit": 1},
        headers=headers,
    )
    assert second_page_response.status_code == 200
    second_page = second_page_response.json()
    assert second_page["page"] == 2
    assert second_page["limit"] == 1
    assert second_page["total"] == 2
    assert len(second_page["items"]) == 1

    empty_filters_response = client.get(
        "/api/employees",
        params={"search": "", "department": "", "status": "", "page": 1, "limit": 10},
        headers=headers,
    )
    assert empty_filters_response.status_code == 200


def test_employee_validation_and_duplicate_email(client: TestClient) -> None:
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    invalid_response = client.get("/api/employees", params={"status": "Pending"}, headers=headers)
    assert invalid_response.status_code == 422

    duplicate_response = client.post(
        "/api/employees",
        json={
            "first_name": "New",
            "last_name": "Employee",
            "email": "JOHN.SMITH@GMAIL.COM",
            "phone_number": "5550101003",
            "department": "Engineering",
            "designation": "Developer",
            "joining_date": "2024-01-15",
            "salary": 65000,
            "status": "Active",
        },
        headers=headers,
    )
    assert duplicate_response.status_code == 409

    invalid_email_response = client.post(
        "/api/employees",
        json={
            "first_name": "New",
            "last_name": "Employee",
            "email": "person@example.com",
            "phone_number": "5550101003",
            "department": "Engineering",
            "designation": "Developer",
            "joining_date": "2024-01-15",
            "salary": 65000,
            "status": "Active",
        },
        headers=headers,
    )
    assert invalid_email_response.status_code == 422

    invalid_phone_response = client.post(
        "/api/employees",
        json={
            "first_name": "New",
            "last_name": "Employee",
            "email": "new.employee@gmail.com",
            "phone_number": "55501abc03",
            "department": "Engineering",
            "designation": "Developer",
            "joining_date": "2024-01-15",
            "salary": 65000,
            "status": "Active",
        },
        headers=headers,
    )
    assert invalid_phone_response.status_code == 422


def test_employee_crud_flow(client: TestClient) -> None:
    token = get_auth_token(client)
    email = f"employee-{uuid4().hex[:8]}@gmail.com"
    payload = {
        "employee_id": "EMP-MANUAL",
        "first_name": "Alice",
        "last_name": "Brown",
        "email": email,
        "phone_number": "5550102020",
        "department": "Finance",
        "designation": "Accountant",
        "joining_date": "2024-01-15",
        "salary": 65000,
        "status": "Active",
    }

    create_response = client.post(
        "/api/employees",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_response.status_code == 201, create_response.text
    created = create_response.json()
    employee_id = created["id"]
    assert created["email"] == email
    assert created["employee_id"].startswith("EMP-")
    assert created["employee_id"] != payload["employee_id"]
    stored_employee = db_manager.get_employee_by_id(employee_id)
    assert stored_employee is not None
    assert isinstance(stored_employee["joining_date"], datetime)

    detail_response = client.get(
        f"/api/employees/{employee_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200

    invalid_update_response = client.put(
        f"/api/employees/{employee_id}",
        json={
            **payload,
            "email": "alice@example.com",
            "phone_number": "55501abc03",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invalid_update_response.status_code == 422

    update_response = client.put(
        f"/api/employees/{employee_id}",
        json={
            **payload,
            "department": "Operations",
            "status": "Inactive",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["department"] == "Operations"
    assert update_response.json()["employee_id"] == created["employee_id"]

    delete_response = client.delete(
        f"/api/employees/{employee_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 204


def test_connection_failure_does_not_enable_memory_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    class UnavailableMongoClient:
        def __init__(self) -> None:
            self.admin = self
            self.closed = False

        def __getitem__(self, _name: str):
            return self

        def command(self, _name: str) -> None:
            raise ConnectionFailure("MongoDB is unavailable")

        def close(self) -> None:
            self.closed = True

    fake_client = UnavailableMongoClient()
    monkeypatch.setattr(mongo, "MongoClient", lambda *args, **kwargs: fake_client)
    manager = mongo.MongoDBManager()

    with pytest.raises(RuntimeError, match="Unable to connect to MongoDB"):
        manager.connect()

    assert manager.connected is False
    assert manager.db is None
    assert not hasattr(manager, "fallback_data")
    assert fake_client.closed is True
