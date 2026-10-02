from __future__ import annotations

import re
import uuid
from datetime import date, datetime, time, timezone
from typing import Any

from bson import ObjectId
from pymongo import MongoClient

from app.core.config import settings


class MongoDBManager:
    def __init__(self) -> None:
        self.client = None
        self.db = None
        self.connected = False

    def connect(self) -> None:
        if self.client is not None and self.connected:
            return

        client = None
        try:
            client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=15000)
            self.db = client[settings.DATABASE_NAME]
            client.admin.command("ping")
            self.client = client
            self.connected = True
            self.ensure_indexes()
            self.ensure_seed_data()
        except Exception as exc:
            if client is not None:
                client.close()
            self.connected = False
            self.client = None
            self.db = None
            raise RuntimeError(
                "Unable to connect to MongoDB. Check MONGODB_URI and ensure the server is running."
            ) from exc

    def _require_db(self):
        if not self.connected or self.db is None:
            raise RuntimeError("MongoDB is not connected")
        return self.db

    def ensure_indexes(self) -> None:
        db = self._require_db()
        db["users"].create_index("email", unique=True)
        db["employees"].create_index("email", unique=True)
        db["employees"].create_index("employee_id", unique=True)

    def ensure_seed_data(self) -> None:
        db = self._require_db()
        employees_collection = db["employees"]
        for employee in employees_collection.find({"joining_date": {"$type": "string"}}):
            try:
                joining_date = self._mongo_date(employee["joining_date"])
            except ValueError:
                continue
            employees_collection.update_one(
                {"_id": employee["_id"]},
                {"$set": {"joining_date": joining_date}},
            )
        if employees_collection.count_documents({}) == 0:
            employees_collection.insert_many(
                [
                    {
                        "employee_id": "EMP-1001",
                        "first_name": "John",
                        "last_name": "Smith",
                        "email": "john.smith@gmail.com",
                        "phone_number": "5550101001",
                        "department": "Engineering",
                        "designation": "Senior Developer",
                        "joining_date": self._mongo_date("2023-01-15"),
                        "salary": 95000,
                        "status": "Active",
                        "created_at": datetime.utcnow(),
                    },
                    {
                        "employee_id": "EMP-1002",
                        "first_name": "Emma",
                        "last_name": "Jones",
                        "email": "emma.jones@gmail.com",
                        "phone_number": "5550101002",
                        "department": "Human Resources",
                        "designation": "HR Manager",
                        "joining_date": self._mongo_date("2022-11-03"),
                        "salary": 78000,
                        "status": "Inactive",
                        "created_at": datetime.utcnow(),
                    },
                ]
            )

    @staticmethod
    def _mongo_date(value: date | datetime | str) -> datetime:
        if isinstance(value, str):
            value = date.fromisoformat(value)
        if isinstance(value, datetime):
            return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
        if isinstance(value, date):
            return datetime.combine(value, time.min, tzinfo=timezone.utc)
        raise ValueError("Joining date must be a valid ISO date")

    def _normalize_employee(self, employee: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(employee)
        if "_id" in normalized:
            normalized["id"] = str(normalized["_id"])
            normalized.pop("_id", None)
        if "id" not in normalized:
            normalized["id"] = str(uuid.uuid4())
        return normalized

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        return self._require_db()["users"].find_one({"email": email.lower()})

    def get_employee_by_email(self, email: str) -> dict[str, Any] | None:
        return self._require_db()["employees"].find_one({"email": email.lower()})

    def create_user(
        self,
        email: str,
        password_hash: str,
        role: str = "admin",
        employee_record_id: str | None = None,
        name: str | None = None,
        must_change_password: bool = False,
    ) -> dict[str, Any]:
        doc = {
            "email": email.lower(),
            "password": password_hash,
            "role": role,
            "must_change_password": must_change_password,
        }
        if name is not None:
            doc["name"] = name
        if employee_record_id is not None:
            doc["employee_record_id"] = employee_record_id
        result = self._require_db()["users"].insert_one(doc)
        return {"id": str(result.inserted_id), "email": doc["email"], "role": role}

    def update_user_password(self, user_id: ObjectId, password_hash: str) -> None:
        self._require_db()["users"].update_one(
            {"_id": user_id},
            {"$set": {"password": password_hash, "must_change_password": False}},
        )

    def claim_first_admin_registration(self) -> None:
        self._require_db()["admin_registration_lock"].insert_one(
            {"_id": "first_admin", "claimed_at": datetime.utcnow()}
        )

    def release_first_admin_registration(self) -> None:
        self._require_db()["admin_registration_lock"].delete_one({"_id": "first_admin"})

    def get_employees(
        self,
        search: str | None = None,
        department: str | None = None,
        status: str | None = None,
        sort_by: str = "employee_id_asc",
        skip: int = 0,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        query = self._employee_query(search, department, status)
        sort_fields = {
            "employee_id_asc": [("employee_id", 1), ("_id", 1)],
            "employee_id_desc": [("employee_id", -1), ("_id", -1)],
            "name_asc": [("first_name", 1), ("last_name", 1), ("_id", 1)],
            "salary_desc": [("salary", -1), ("_id", 1)],
        }
        if sort_by not in sort_fields:
            raise ValueError("Unsupported employee sort order")
        cursor = (
            self._require_db()["employees"]
            .find(query)
            .sort(sort_fields[sort_by])
            .skip(skip)
            .limit(limit)
        )
        return [self._normalize_employee(item) for item in cursor]

    def count_employees(
        self,
        search: str | None = None,
        department: str | None = None,
        status: str | None = None,
    ) -> int:
        query = self._employee_query(search, department, status)
        return self._require_db()["employees"].count_documents(query)

    def get_departments(self) -> list[str]:
        return sorted(self._require_db()["employees"].distinct("department"))

    @staticmethod
    def _employee_query(search: str | None, department: str | None, status: str | None) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if search:
            regex = re.escape(search.strip())
            query["$or"] = [
                {"first_name": {"$regex": regex, "$options": "i"}},
                {"last_name": {"$regex": regex, "$options": "i"}},
                {"email": {"$regex": regex, "$options": "i"}},
                {
                    "$expr": {
                        "$regexMatch": {
                            "input": {"$concat": ["$first_name", " ", "$last_name"]},
                            "regex": regex,
                            "options": "i",
                        }
                    }
                },
            ]
        if department:
            query["department"] = department
        if status:
            query["status"] = status
        return query

    def get_employee_by_id(self, employee_id: str) -> dict[str, Any] | None:
        collection = self._require_db()["employees"]
        try:
            employee = collection.find_one({"_id": ObjectId(employee_id)})
        except Exception:
            employee = collection.find_one({"employee_id": employee_id})
        return self._normalize_employee(employee) if employee else None

    def create_employee(self, employee_data: dict[str, Any]) -> dict[str, Any]:
        doc = dict(employee_data)
        doc["email"] = doc["email"].lower()
        if "joining_date" in doc:
            doc["joining_date"] = self._mongo_date(doc["joining_date"])
        doc["created_at"] = datetime.utcnow()
        doc["employee_id"] = f"EMP-{uuid.uuid4().hex[:12].upper()}"

        collection = self._require_db()["employees"]
        result = collection.insert_one(doc)
        created = collection.find_one({"_id": result.inserted_id})
        return self._normalize_employee(created)

    def update_employee(self, employee_id: str, employee_data: dict[str, Any]) -> dict[str, Any] | None:
        payload = dict(employee_data)
        payload.pop("employee_id", None)
        if "joining_date" in payload:
            payload["joining_date"] = self._mongo_date(payload["joining_date"])

        collection = self._require_db()["employees"]
        try:
            result = collection.find_one_and_update(
                {"_id": ObjectId(employee_id)},
                {"$set": payload},
                return_document=True,
            )
        except Exception:
            result = collection.find_one_and_update(
                {"employee_id": employee_id},
                {"$set": payload},
                return_document=True,
            )
        return self._normalize_employee(result) if result else None

    def delete_employee(self, employee_id: str) -> bool:
        collection = self._require_db()["employees"]
        try:
            result = collection.delete_one({"_id": ObjectId(employee_id)})
            if result.deleted_count:
                return True
        except Exception:
            pass
        result = collection.delete_one({"employee_id": employee_id})
        return result.deleted_count > 0

    def get_dashboard_stats(self) -> dict[str, int]:
        counts = {
            item["_id"]: item["count"]
            for item in self._require_db()["employees"].aggregate(
                [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
            )
        }
        return {
            "total_employees": sum(counts.values()),
            "active_employees": counts.get("Active", 0),
            "inactive_employees": counts.get("Inactive", 0),
        }


db_manager = MongoDBManager()
