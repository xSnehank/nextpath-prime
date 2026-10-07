"""Helpers for live-mode tests: a throwaway PostgreSQL built from db/migrations and db/seed, and people
signed up the way Supabase does it (a row in auth.users, which the handle_new_user trigger copies).

The database comes from db/scripts/check_db.py, so these tests run against the real schema. They're skipped
when the PostgreSQL command-line tools aren't installed.
"""

import importlib.util
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine_for
from tests.helpers import make_client

CHECK_DB = Path(__file__).resolve().parents[2] / "db" / "scripts" / "check_db.py"


def _load_check_db() -> Any:
    spec = importlib.util.spec_from_file_location("check_db", CHECK_DB)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check_db = _load_check_db()


@contextmanager
def database() -> Iterator[str]:
    with check_db.throwaway_database() as url:
        yield url


def live_client(database_url: str, **overrides: Any) -> TestClient:
    """The app in live mode against the throwaway database. X-Dev-User names a users.id (DEV_AUTH_BYPASS)."""
    settings = {
        "use_mocks": False,
        "dev_auth_bypass": True,
        "database_url": database_url,
        "supabase_url": "http://supabase.invalid",
        "supabase_anon_key": "test-anon-key",
    }
    return make_client(**settings | overrides)


def sign_up(database_url: str, role: str, name: str | None = None) -> UUID:
    """A new account with this role; returns its id."""
    with engine_for(database_url).begin() as conn:
        return conn.execute(
            text(
                "INSERT INTO auth.users (email, raw_user_meta_data) "
                "VALUES (:email, jsonb_build_object('role', CAST(:role AS text), 'full_name', CAST(:name AS text))) "
                "RETURNING id"
            ),
            {"email": f"{role}-{uuid4().hex[:8]}@test.local", "role": role, "name": name},
        ).scalar_one()


def run_sql(database_url: str, sql: str, **params: Any) -> None:
    with engine_for(database_url).begin() as conn:
        conn.execute(text(sql), params)


def as_user(user_id: UUID) -> dict[str, str]:
    return {"X-Dev-User": str(user_id)}
