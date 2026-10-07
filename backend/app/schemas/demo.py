from uuid import UUID

from app.schemas.common import StrictModel


class DemoRunResponse(StrictModel):
    result_id: UUID
    student_id: UUID
    parent_id: UUID
