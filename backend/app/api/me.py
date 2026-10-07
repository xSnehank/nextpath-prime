from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import CurrentUserDep, SettingsDep
from app.errors import error_responses
from app.repositories import pairs, results, users
from app.schemas.common import Role
from app.schemas.me import MeResponse, Pair, PartnerStatus, Progress
from app.services.progress import progress_for

router = APIRouter(tags=["me"])


@router.get(
    "/me",
    response_model=MeResponse,
    responses=error_responses(401),
    summary="Who am I: role, linked pair, progress and consent flags",
)
def read_me(user: CurrentUserDep, settings: SettingsDep, conn: ConnDep) -> MeResponse:
    if settings.use_mocks:
        return mocks.load(f"me_{user.role.value}", MeResponse)
    me = users.get_user(conn, user.id)
    mine = progress_for(conn, user.id, user.role)
    pair = pairs.get_pair(conn, user.id)
    partner = None
    latest_result_id = None
    if pair is not None:
        partner_id = pair.parent_id if user.role is Role.STUDENT else pair.student_id
        partner_role = Role.PARENT if user.role is Role.STUDENT else Role.STUDENT
        theirs = progress_for(conn, partner_id, partner_role)
        partner_row = users.get_user(conn, partner_id)
        partner = PartnerStatus(
            role=partner_role,
            full_name=partner_row.full_name if partner_row else None,
            assessment_complete=theirs.assessment_complete,
            consented=theirs.consented,
        )
        latest_result_id = results.latest_result_id(conn, pair.student_id, pair.parent_id)
    return MeResponse(
        user_id=me.id,
        role=user.role,
        email=me.email,
        full_name=me.full_name,
        pair=Pair(student_id=pair.student_id, parent_id=pair.parent_id) if pair else None,
        progress=Progress(
            questions_answered=mine.questions_answered,
            questions_required=mine.questions_required,
            profile_complete=mine.profile_complete,
            assessment_complete=mine.assessment_complete,
        ),
        consented=mine.consented,
        partner=partner,
        latest_result_id=latest_result_id,
    )
