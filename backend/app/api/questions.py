from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import error_responses, not_implemented
from app.schemas.common import Role
from app.schemas.questions import QuestionSet

router = APIRouter(tags=["assessment"])


@router.get(
    "/questions",
    response_model=QuestionSet,
    responses=error_responses(401, 422),
    summary="The question set for students or parents",
)
def get_questions(audience: Role, _user: CurrentUserDep, settings: SettingsDep) -> QuestionSet:
    if settings.use_mocks:
        return mocks.load(f"questions_{audience.value}", QuestionSet)
    raise not_implemented("feat/be-B-responses-api")
