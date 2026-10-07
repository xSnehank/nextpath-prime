"""The question bank and saved answers."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import Row, text
from sqlalchemy.engine import Connection


def list_questions(conn: Connection, audience: str) -> list[Row]:
    """In display order. Includes the answer key and reverse flag: callers must not send those out."""
    return list(
        conn.execute(
            text(
                """
                SELECT id, position, kind, dimension, text, options, correct_value, reverse_scored, required
                FROM questions WHERE audience = :audience ORDER BY position
                """
            ),
            {"audience": audience},
        )
    )


def save_answers(conn: Connection, user_id: UUID, answers: Iterable[tuple[UUID, int]]) -> None:
    """Re-sending a question overwrites its answer."""
    conn.execute(
        text(
            """
            INSERT INTO responses (user_id, question_id, value) VALUES (:user_id, :question_id, :value)
            ON CONFLICT (user_id, question_id) DO UPDATE SET value = EXCLUDED.value, answered_at = now()
            """
        ),
        [{"user_id": user_id, "question_id": question_id, "value": value} for question_id, value in answers],
    )


def get_answers(conn: Connection, user_id: UUID) -> dict[UUID, int]:
    return {
        row.question_id: row.value
        for row in conn.execute(text("SELECT question_id, value FROM responses WHERE user_id = :id"), {"id": user_id})
    }
