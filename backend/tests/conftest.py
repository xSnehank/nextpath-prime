import pytest
from fastapi.testclient import TestClient

from tests.helpers import make_client


@pytest.fixture
def client() -> TestClient:
    """The app in mock mode with demo enabled, ignoring your local .env."""
    return make_client()


@pytest.fixture(scope="session")
def db_url():
    """A throwaway PostgreSQL with the real schema and seeds, shared by the live-mode tests of one run."""
    from tests.live import check_db, database

    try:
        with database() as url:
            yield url
    except check_db.CheckFailed as missing:
        pytest.skip(f"no PostgreSQL to test against: {missing}")
