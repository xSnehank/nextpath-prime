"""Invites and the student <-> parent link (tables invites and pairs)."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Row, text
from sqlalchemy.engine import Connection


def get_pair(conn: Connection, user_id: UUID) -> Row | None:
    """The pair this user belongs to, as student or as parent."""
    return conn.execute(
        text("SELECT student_id, parent_id, linked_at FROM pairs WHERE student_id = :id OR parent_id = :id"),
        {"id": user_id},
    ).first()


def save_invite(conn: Connection, student_id: UUID, code_hash: str, expires_at: datetime) -> None:
    """A student has one invite at a time; a new one replaces the old."""
    conn.execute(
        text(
            """
            INSERT INTO invites (student_id, code_hash, expires_at) VALUES (:student_id, :code_hash, :expires_at)
            ON CONFLICT (student_id) DO UPDATE
                SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, created_at = now()
            """
        ),
        {"student_id": student_id, "code_hash": code_hash, "expires_at": expires_at},
    )


def find_invite(conn: Connection, code_hash: str) -> Row | None:
    """The invite with this hash, locked until the transaction ends so it can't be redeemed twice."""
    return conn.execute(
        text("SELECT student_id, expires_at FROM invites WHERE code_hash = :code_hash FOR UPDATE"),
        {"code_hash": code_hash},
    ).first()


def link(conn: Connection, student_id: UUID, parent_id: UUID) -> datetime:
    """Create the pair and use up the invite. Returns when they were linked."""
    linked_at = conn.execute(
        text("INSERT INTO pairs (student_id, parent_id) VALUES (:student_id, :parent_id) RETURNING linked_at"),
        {"student_id": student_id, "parent_id": parent_id},
    ).scalar_one()
    conn.execute(text("DELETE FROM invites WHERE student_id = :student_id"), {"student_id": student_id})
    return linked_at
