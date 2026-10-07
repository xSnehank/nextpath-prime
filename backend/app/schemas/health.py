from typing import Literal

from pydantic import Field

from app.schemas.common import StrictModel


class HealthResponse(StrictModel):
    status: Literal["ok"]
    database: Literal["ok", "unavailable", "skipped"] = Field(description="'skipped' until the database check lands")
    mode: Literal["mock", "live"]
    version: str
