"""How far each person is: profile saved, questions answered, assessment complete."""

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.engine import Connection

from app.repositories import assessment, profiles
from app.schemas.common import Role

# The profile fields that must be filled before the analysis can run (the optional ones are left out).
STUDENT_FIELDS = ("risk_appetite", "preferred_state", "open_to_abroad", "home_state")
PARENT_FIELDS = (
    "annual_education_budget",
    "savings",
    "max_loan",
    "risk_appetite",
    "breakeven_tolerance_years",
    "preferred_state",
    "open_to_abroad",
)


@dataclass(frozen=True)
class Progress:
    questions_answered: int
    questions_required: int
    profile_complete: bool
    assessment_complete: bool
    consented: bool


def progress_for(conn: Connection, user_id: UUID, role: Role) -> Progress:
    profile = profiles.get_profile(conn, user_id)
    consented = bool(profile and profile.consent_to_compare)
    if role is Role.PARENT:
        complete = (
            profile is not None
            and all(getattr(profile, field) is not None for field in PARENT_FIELDS)
            and len(profiles.get_top_domain_ids(conn, user_id)) == 3
        )
        return Progress(0, 0, complete, complete, consented)

    questions = assessment.list_questions(conn, Role.STUDENT.value)
    answered_ids = assessment.get_answers(conn, user_id).keys()
    current_ids = {question.id for question in questions}
    required_ids = {question.id for question in questions if question.required}
    profile_complete = profile is not None and all(getattr(profile, field) is not None for field in STUDENT_FIELDS)
    return Progress(
        questions_answered=len(answered_ids & current_ids),
        questions_required=len(required_ids),
        profile_complete=profile_complete,
        assessment_complete=profile_complete and required_ids <= answered_ids,
        consented=consented,
    )
