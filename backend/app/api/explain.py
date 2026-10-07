from uuid import UUID

from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import OptionalUserDep, SettingsDep
from app.errors import AppError, error_responses
from app.schemas.analyze import AnalyzeResponse
from app.schemas.common import ErrorCode
from app.schemas.explain import ExplainRequest, ExplainResponse
from app.services import explain as explanations
from app.services.access import readable_result

router = APIRouter(tags=["analysis"])


@router.post(
    "/explain",
    response_model=ExplainResponse,
    responses=error_responses(401, 404, 409, 422),
    summary="Plain-language explanation of one career in a result",
)
def explain(body: ExplainRequest, user: OptionalUserDep, settings: SettingsDep, conn: ConnDep) -> ExplainResponse:
    """Cached Gemini text, fresh Gemini text, or the template, in that order (source says which)."""
    if settings.use_mocks:
        found = mocks.load("explanations", dict[UUID, ExplainResponse])
        if body.result_id != mocks.MOCK_RESULT_ID or body.career_id not in found:
            raise AppError(ErrorCode.NOT_FOUND, "No such career in this result.")
        return found[body.career_id]
    result = AnalyzeResponse.model_validate(readable_result(conn, settings, user, body.result_id).response)
    item = next((item for item in result.roadmap if item.career_id == body.career_id), None)
    if item is None:
        raise AppError(ErrorCode.NOT_FOUND, "No such career in this result.")
    return explanations.explain(conn, settings, body.result_id, item)
