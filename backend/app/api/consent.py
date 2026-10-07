from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import error_responses, not_implemented
from app.schemas.consent import ConsentRequest, ConsentResponse

router = APIRouter(tags=["assessment"])


@router.post(
    "/consent",
    response_model=ConsentResponse,
    responses=error_responses(401, 422),
    summary="Agree (or stop agreeing) to the parent-student comparison",
)
def give_consent(body: ConsentRequest, _user: CurrentUserDep, settings: SettingsDep) -> ConsentResponse:
    if settings.use_mocks:
        if body.agree:
            return mocks.load("consent", ConsentResponse)
        return ConsentResponse(consented=False, consented_at=None, both_consented=False)
    raise not_implemented("feat/be-B-responses-api")
