from uuid import UUID

from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses
from app.repositories import catalog
from app.schemas.common import ErrorCode
from app.schemas.market import CareerMarket, RegionMarket

router = APIRouter(tags=["careers"])


@router.get(
    "/careers/{career_id}/market",
    response_model=CareerMarket,
    responses=error_responses(401, 404, 422),
    summary="Demand and salary by region for one career",
)
def career_market(career_id: UUID, _user: CurrentUserDep, settings: SettingsDep, conn: ConnDep) -> CareerMarket:
    if settings.use_mocks:
        markets = mocks.load("careers_market", dict[UUID, CareerMarket])
        if career_id not in markets:
            raise AppError(ErrorCode.NOT_FOUND, "No career with this id.")
        return markets[career_id]
    career = catalog.get_career(conn, career_id)
    if career is None:
        raise AppError(ErrorCode.NOT_FOUND, "No career with this id.")
    rows = [
        RegionMarket(
            region=row.region,
            demand_index=round(float(row.demand_index) / 100, 4) if row.demand_index is not None else 0.0,
            growth_rate=float(row.growth_rate) if row.growth_rate is not None else None,
            median_salary=row.median_salary,
            entry_salary=row.entry_salary,
            as_of=row.as_of,
            source=row.source,
            data_quality="estimated" if row.estimated else "sourced",
        )
        for row in catalog.list_market_data(conn, [career_id])
    ]
    national = next((row for row in rows if row.region == "India"), None)
    regions = sorted((row for row in rows if row.region != "India"), key=lambda row: row.region)
    return CareerMarket(career_id=career.id, career=career.name, domain=career.domain, national=national, regions=regions)
