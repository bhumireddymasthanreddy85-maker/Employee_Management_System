import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ["DATABASE_NAME"] = "employee_management_test"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import hash_password
from app.db.mongo import db_manager
from app.main import app


@pytest.fixture(scope="module")
def client():
    try:
        with TestClient(app) as test_client:
            if db_manager.get_user_by_email("admin@company.com") is None:
                db_manager.create_user("admin@company.com", hash_password("admin123"), role="admin")
            yield test_client
    finally:
        if db_manager.client is not None:
            db_manager.client.drop_database(settings.DATABASE_NAME)
            db_manager.client.close()
            db_manager.client = None
            db_manager.db = None
            db_manager.connected = False
