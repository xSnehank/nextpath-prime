from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import StrictModel


class InviteResponse(StrictModel):
    invite_code: str = Field(description="Short code the student shares with their parent; single use")
    expires_at: datetime


class LinkRequest(StrictModel):
    invite_code: str = Field(min_length=6, max_length=32)


class LinkResponse(StrictModel):
    student_id: UUID
    parent_id: UUID
    linked_at: datetime
