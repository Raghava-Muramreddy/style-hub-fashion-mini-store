import os
import tempfile

_db = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_fake_key_for_unit_tests"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
