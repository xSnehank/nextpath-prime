from uuid import UUID

from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses, not_implemented
from app.schemas.common import ErrorCode
from app.schemas.market import CareerMarket

router = APIRouter(tags=["careers"])


@router.get(
    "/careers/{career_id}/market",
    response_model=CareerMarket,
    responses=error_responses(401, 404, 422),
    summary="Demand and salary by region for one career",
)
def career_market(career_id: UUID, _user: CurrentUserDep, settings: SettingsDep) -> CareerMarket:
    if settings.use_mocks:
        markets = mocks.load("careers_market", dict[UUID, CareerMarket])
        if career_id not in markets:
            raise AppError(ErrorCode.NOT_FOUND, "No career with this id.")
        return markets[career_id]
    raise not_implemented("feat/be-D2-market-blend")
