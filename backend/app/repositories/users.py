"""The users table: one row per Supabase account (created by the handle_new_user trigger)."""

from uuid import UUID

from sqlalchemy import Row, text
from sqlalchemy.engine import Connection


def get_user(conn: Connection, user_id: UUID) -> Row | None:
    return conn.execute(
        text("SELECT id, role, email, full_name FROM users WHERE id = :id"), {"id": user_id}
    ).first()
