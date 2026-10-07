"""Who may read a saved result: the linked pair while both still agree to the comparison, or anyone for the
demo family's result while DEMO_ENABLED=true."""

from uuid import UUID

from sqlalchemy import Row
from sqlalchemy.engine import Connection

from app.config import Settings
from app.deps import CurrentUser
from app.errors import AppError
from app.repositories import profiles, results
from app.schemas.common import ErrorCode
from app.services.demo import is_demo_pair


def readable_result(conn: Connection, settings: Settings, user: CurrentUser | None, result_id: UUID) -> Row:
    row = results.get_result(conn, result_id)
    if row is None:
        raise AppError(ErrorCode.NOT_FOUND, "No result with this id.")
    if settings.demo_enabled and is_demo_pair(row.student_id, row.parent_id):
        return row
    if user is None:
        raise AppError(ErrorCode.UNAUTHENTICATED, "Sign in first: send Authorization: Bearer <Supabase access token>.")
    if user.id not in (row.student_id, row.parent_id):
        raise AppError(ErrorCode.NOT_FOUND, "No result with this id.")  # don't confirm that someone else's exists
    missing = [
        role
        for role, person in (("student", row.student_id), ("parent", row.parent_id))
        if not (profile := profiles.get_profile(conn, person)) or not profile.consent_to_compare
    ]
    if missing:
        raise AppError(ErrorCode.CONSENT_REQUIRED, "This comparison is hidden until both of you agree again.", {"missing": missing})
    return row
