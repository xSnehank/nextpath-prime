from datetime import datetime

from pydantic import Field

from app.schemas.common import StrictModel


class ConsentRequest(StrictModel):
    agree: bool = Field(description="true to allow the parent-student comparison, false to withdraw")


class ConsentResponse(StrictModel):
    consented: bool
    consented_at: datetime | None
    both_consented: bool = Field(description="True when the linked partner has agreed too")
