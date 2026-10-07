from uuid import UUID

from pydantic import Field

from app.schemas.common import Role, StrictModel


class Pair(StrictModel):
    student_id: UUID
    parent_id: UUID


class Progress(StrictModel):
    questions_answered: int = Field(ge=0)
    questions_required: int = Field(ge=0, description="0 for parents: their assessment is the profile form")
    profile_complete: bool
    assessment_complete: bool = Field(description="All required questions answered and the profile saved")


class PartnerStatus(StrictModel):
    """Only status flags about the linked partner; never their answers."""

    role: Role
    assessment_complete: bool
    consented: bool


class MeResponse(StrictModel):
    user_id: UUID
    role: Role
    email: str
    full_name: str | None
    pair: Pair | None = Field(description="Null until the parent redeems the invite code")
    progress: Progress
    consented: bool
    partner: PartnerStatus | None = Field(description="Null until linked")
    latest_result_id: UUID | None
