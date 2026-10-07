from uuid import UUID

from pydantic import Field

from app.schemas.common import StrictModel


class Answer(StrictModel):
    question_id: UUID
    value: int = Field(
        ge=1,
        le=5,
        description="likert: 1 = strongly disagree ... 5 = strongly agree; choice: the picked option's value (1-4 = A-D)",
    )


class ResponsesBatch(StrictModel):
    answers: list[Answer] = Field(min_length=1, max_length=200)


class ResponsesSaved(StrictModel):
    saved: int = Field(ge=0, description="Questions stored by this request; re-sending a question overwrites it")
    answered: int = Field(ge=0, description="Questions this user has answered so far")
    required: int = Field(ge=0)
    complete: bool
