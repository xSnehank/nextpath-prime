import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import ParentDep, SettingsDep, StudentDep
from app.errors import AppError, error_responses
from app.repositories import pairs
from app.schemas.auth import InviteResponse, LinkRequest, LinkResponse
from app.schemas.common import ErrorCode

router = APIRouter(prefix="/auth", tags=["auth"])

INVITE_LIFETIME = timedelta(days=7)
# No 0/O or 1/I, so a parent can't misread the code from a phone screen.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def new_invite_code() -> str:
    return "PRISM-" + "".join(secrets.choice(CODE_ALPHABET) for _ in range(8))


def hash_invite_code(code: str) -> str:
    """Only this hash is stored, so a leaked database can't be used to redeem a live invite."""
    return hashlib.sha256(code.strip().upper().encode()).hexdigest()


@router.post(
    "/invite",
    status_code=201,
    response_model=InviteResponse,
    responses=error_responses(401, 403),
    summary="Student creates an invite code for their parent",
)
def create_invite(user: StudentDep, settings: SettingsDep, conn: ConnDep) -> InviteResponse:
    """A new code replaces the student's previous one."""
    if settings.use_mocks:
        invite = mocks.load("invite", InviteResponse)
        return invite.model_copy(update={"expires_at": datetime.now(UTC) + INVITE_LIFETIME})
    if pairs.get_pair(conn, user.id):
        raise AppError(ErrorCode.FORBIDDEN, "You are already linked with a parent.")
    code = new_invite_code()
    expires_at = datetime.now(UTC) + INVITE_LIFETIME
    pairs.save_invite(conn, user.id, hash_invite_code(code), expires_at)
    return InviteResponse(invite_code=code, expires_at=expires_at)


@router.post(
    "/link",
    response_model=LinkResponse,
    responses=error_responses(401, 403, 404, 422),
    summary="Parent redeems the invite code, linking the two accounts",
)
def link_accounts(body: LinkRequest, user: ParentDep, settings: SettingsDep, conn: ConnDep) -> LinkResponse:
    if settings.use_mocks:
        return mocks.load("link", LinkResponse)
    invite = pairs.find_invite(conn, hash_invite_code(body.invite_code))
    if invite is None or invite.expires_at <= datetime.now(UTC):
        raise AppError(ErrorCode.NOT_FOUND, "This invite code is not valid or has expired. Ask your child for a new one.")
    if pairs.get_pair(conn, user.id):
        raise AppError(ErrorCode.FORBIDDEN, "You are already linked with a student.")
    if pairs.get_pair(conn, invite.student_id):
        raise AppError(ErrorCode.FORBIDDEN, "This student is already linked with a parent.")
    linked_at = pairs.link(conn, invite.student_id, user.id)
    return LinkResponse(student_id=invite.student_id, parent_id=user.id, linked_at=linked_at)
