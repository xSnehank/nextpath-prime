from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import StrictModel


class ExplainRequest(StrictModel):
    result_id: UUID
    career_id: UUID


class ExplainResponse(StrictModel):
    career_id: UUID
    text: str = Field(description="Under 150 words, built only from the numbers in the result")
    source: Literal["cache", "gemini", "template"] = Field(description="Lets the UI tag AI-written vs template text")
