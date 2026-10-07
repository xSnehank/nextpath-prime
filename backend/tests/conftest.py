import pytest
from fastapi.testclient import TestClient

from tests.helpers import make_client


@pytest.fixture
def client() -> TestClient:
    """The app in mock mode with demo enabled, ignoring your local .env."""
    return make_client()
