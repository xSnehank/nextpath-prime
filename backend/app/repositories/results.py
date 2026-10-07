"""Saved analyses and the explanation cache."""

import json
from typing import Any
from uuid import UUID

from sqlalchemy import Row, text
from sqlalchemy.engine import Connection


def save_result(
    conn: Connection,
    result_id: UUID,
    student_id: UUID,
    parent_id: UUID,
    weights: dict[str, float],
    conflict_index: int,
    response: dict[str, Any],
) -> None:
    conn.execute(
        text(
            """
            INSERT INTO results (id, student_id, parent_id, weights, conflict_index, response, created_at)
            VALUES (:id, :student_id, :parent_id, CAST(:weights AS jsonb), :conflict_index, CAST(:response AS jsonb),
                    :created_at)
            """
        ),
        {
            "id": result_id,
            "student_id": student_id,
            "parent_id": parent_id,
            "weights": json.dumps(weights),
            "conflict_index": conflict_index,
            "response": json.dumps(response),
            "created_at": response["created_at"],
        },
    )


def get_result(conn: Connection, result_id: UUID) -> Row | None:
    return conn.execute(
        text("SELECT id, student_id, parent_id, response FROM results WHERE id = :id"), {"id": result_id}
    ).first()


def latest_result_id(conn: Connection, student_id: UUID, parent_id: UUID) -> UUID | None:
    return conn.execute(
        text(
            """
            SELECT id FROM results WHERE student_id = :student_id AND parent_id = :parent_id
            ORDER BY created_at DESC LIMIT 1
            """
        ),
        {"student_id": student_id, "parent_id": parent_id},
    ).scalar()


def get_explanation(conn: Connection, result_id: UUID, career_id: UUID, model: str) -> str | None:
    return conn.execute(
        text("SELECT text FROM explanations WHERE result_id = :r AND career_id = :c AND model = :m"),
        {"r": result_id, "c": career_id, "m": model},
    ).scalar()


def save_explanation(conn: Connection, result_id: UUID, career_id: UUID, model: str, body: str, source: str) -> None:
    conn.execute(
        text(
            """
            INSERT INTO explanations (result_id, career_id, model, text, source) VALUES (:r, :c, :m, :t, :s)
            ON CONFLICT (result_id, career_id, model) DO UPDATE SET text = EXCLUDED.text, source = EXCLUDED.source
            """
        ),
        {"r": result_id, "c": career_id, "m": model, "t": body, "s": source},
    )
