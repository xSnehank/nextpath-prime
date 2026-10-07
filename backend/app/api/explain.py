from uuid import UUID

from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses, not_implemented
from app.schemas.common import ErrorCode
from app.schemas.explain import ExplainRequest, ExplainResponse

router = APIRouter(tags=["analysis"])


@router.post(
    "/explain",
    response_model=ExplainResponse,
    responses=error_responses(401, 403, 404, 422),
    summary="Plain-language explanation of one career in a result",
)
def explain(body: ExplainRequest, _user: CurrentUserDep, settings: SettingsDep) -> ExplainResponse:
    if settings.use_mocks:
        explanations = mocks.load("explanations", dict[UUID, ExplainResponse])
        if body.result_id != mocks.MOCK_RESULT_ID or body.career_id not in explanations:
            raise AppError(ErrorCode.NOT_FOUND, "No such career in this result.")
        return explanations[body.career_id]
    raise not_implemented("feat/be-E3-template-explanations")
