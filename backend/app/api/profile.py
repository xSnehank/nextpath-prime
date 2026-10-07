from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses
from app.repositories import catalog, profiles
from app.schemas.common import ErrorCode, Role
from app.schemas.domains import Domain
from app.schemas.profile import ParentProfile, Profile, StudentProfile
from app.services.progress import PARENT_FIELDS, STUDENT_FIELDS

router = APIRouter(tags=["profile"])


@router.get("/profile", response_model=Profile, responses=error_responses(401, 404), summary="Your saved profile")
def read_profile(user: CurrentUserDep, settings: SettingsDep, conn: ConnDep) -> ParentProfile | StudentProfile:
    if settings.use_mocks:
        model = ParentProfile if user.role is Role.PARENT else StudentProfile
        return mocks.load(f"profile_{user.role.value}", model)
    row = profiles.get_profile(conn, user.id)
    if user.role is Role.PARENT:
        domain_ids = profiles.get_top_domain_ids(conn, user.id)
        if row is None or any(getattr(row, field) is None for field in PARENT_FIELDS) or len(domain_ids) != 3:
            raise AppError(ErrorCode.NOT_FOUND, "You haven't saved your profile yet.")
        return ParentProfile(
            role=Role.PARENT,
            annual_education_budget=row.annual_education_budget,
            savings=row.savings,
            max_loan=row.max_loan,
            annual_income=row.annual_income,
            risk_appetite=row.risk_appetite,
            breakeven_tolerance_years=row.breakeven_tolerance_years,
            preferred_state=row.preferred_state,
            open_to_abroad=row.open_to_abroad,
            top_domain_ids=domain_ids,
        )
    if row is None or any(getattr(row, field) is None for field in STUDENT_FIELDS):
        raise AppError(ErrorCode.NOT_FOUND, "You haven't saved your profile yet.")
    return StudentProfile(
        role=Role.STUDENT,
        risk_appetite=row.risk_appetite,
        preferred_state=row.preferred_state,
        open_to_abroad=row.open_to_abroad,
        home_state=row.home_state,
        category=row.category,
        percentage=float(row.percentage) if row.percentage is not None else None,
        gender=row.gender,
    )


@router.put(
    "/profile",
    response_model=Profile,
    responses=error_responses(401, 403, 422),
    summary="Save your profile: a parent's finances and hopes, or a student's preferences",
)
def save_profile(
    body: Profile, user: CurrentUserDep, settings: SettingsDep, conn: ConnDep
) -> ParentProfile | StudentProfile:
    if body.role != user.role:
        raise AppError(ErrorCode.FORBIDDEN, f"You are signed in as a {user.role.value}; send a {user.role.value} profile.")
    if isinstance(body, ParentProfile):
        known = (
            {domain.id for domain in mocks.load("domains", list[Domain])}
            if settings.use_mocks
            else catalog.existing_domain_ids(conn, body.top_domain_ids)
        )
        unknown = [str(domain_id) for domain_id in body.top_domain_ids if domain_id not in known]
        if unknown:
            raise AppError(
                ErrorCode.VALIDATION_ERROR, "Unknown domain id; use ids from GET /domains.", {"unknown_domain_ids": unknown}
            )
    if settings.use_mocks:
        return body
    if isinstance(body, ParentProfile):
        profiles.save_parent_profile(conn, user.id, body)
    else:
        profiles.save_student_profile(conn, user.id, body)
    return body
