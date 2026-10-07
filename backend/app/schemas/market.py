from datetime import date
from uuid import UUID

from pydantic import Field

from app.schemas.common import DataQuality, Region, Rupees, Score, StrictModel


class RegionMarket(StrictModel):
    """Market figures for one career in one region (or "India" for the national figure)."""

    region: Region
    demand_index: Score
    growth_rate: float | None = Field(description="Yearly growth in percent, as published by the source")
    median_salary: Rupees | None
    entry_salary: Rupees | None = Field(description="Typical starting salary for a fresher")
    as_of: date
    source: str
    data_quality: DataQuality = Field(
        description="'estimated' when the figure is an estimate or the national figure stands in for missing regional data"
    )


class CareerMarket(StrictModel):
    career_id: UUID
    career: str
    domain: str
    national: RegionMarket | None
    regions: list[RegionMarket]
