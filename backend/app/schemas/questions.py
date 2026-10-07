from typing import Literal, Self
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.common import Dimension, Role, StrictModel, TraitGroup


class AnswerOption(StrictModel):
    value: int = Field(ge=1, le=5, description="likert: 1-5; choice: 1-4 for options A-D")
    label: str


class Question(StrictModel):
    """One question. Whether a statement is reverse-scored, and which option is correct, stay on the server."""

    id: UUID
    kind: Literal["likert", "choice"] = Field(
        description="likert: rate a statement from 1 to 5. choice: pick the one correct option; the server grades it"
    )
    group: TraitGroup
    dimension: Dimension
    text: str
    options: list[AnswerOption]
    required: bool

    @model_validator(mode="after")
    def _options_fit_the_kind(self) -> Self:
        values = [option.value for option in self.options]
        if self.kind == "likert" and values != [1, 2, 3, 4, 5]:
            raise ValueError("A likert question has the options 1 to 5, in order.")
        if self.kind == "choice" and (len(values) < 2 or values != list(range(1, len(values) + 1))):
            raise ValueError("A choice question has 2 to 5 options numbered from 1, in order.")
        return self


class QuestionSet(StrictModel):
    audience: Role
    questions: list[Question] = Field(
        description="In display order. Empty for parents: their assessment is the profile form (PUT /profile)."
    )
