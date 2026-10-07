from uuid import UUID

from pydantic import Field

from app.schemas.common import Dimension, Role, StrictModel, TraitGroup


class AnswerOption(StrictModel):
    value: int = Field(ge=1, le=5)
    label: str


class Question(StrictModel):
    """One 1-5 statement. Whether it is reverse-scored stays on the server."""

    id: UUID
    group: TraitGroup
    dimension: Dimension
    text: str
    options: list[AnswerOption]
    required: bool


class QuestionSet(StrictModel):
    audience: Role
    questions: list[Question] = Field(
        description="In display order. Empty for parents: their assessment is the profile form (PUT /profile)."
    )
