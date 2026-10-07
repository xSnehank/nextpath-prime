from uuid import UUID

from app.schemas.common import StrictModel


class Domain(StrictModel):
    id: UUID
    name: str
    description: str | None
