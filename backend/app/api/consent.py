from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import CurrentUserDep, SettingsDep
from app.errors import error_responses
from app.repositories import pairs, profiles
from app.schemas.consent import ConsentRequest, ConsentResponse

router = APIRouter(tags=["assessment"])


@router.post(
    "/consent",
    response_model=ConsentResponse,
    responses=error_responses(401, 422),
    summary="Agree (or stop agreeing) to the parent-student comparison",
)
def give_consent(body: ConsentRequest, user: CurrentUserDep, settings: SettingsDep, conn: ConnDep) -> ConsentResponse:
    if settings.use_mocks:
        if body.agree:
            return mocks.load("consent", ConsentResponse)
        return ConsentResponse(consented=False, consented_at=None, both_consented=False)
    mine = profiles.set_consent(conn, user.id, body.agree)
    both = False
    pair = pairs.get_pair(conn, user.id)
    if pair is not None and mine.consent_to_compare:
        partner_id = pair.parent_id if pair.student_id == user.id else pair.student_id
        partner = profiles.get_profile(conn, partner_id)
        both = bool(partner and partner.consent_to_compare)
    return ConsentResponse(consented=mine.consent_to_compare, consented_at=mine.consent_at, both_consented=both)
