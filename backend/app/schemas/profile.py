"""Profile: the parent's financial limits and hopes, or the student's preferences.

Saved with PUT /profile. The "role" field picks which shape the body must have.
"""

from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.common import IndianState, RiskLevel, Role, Rupees, StrictModel


class ParentProfile(StrictModel):
    role: Literal[Role.PARENT]
    annual_education_budget: Rupees = Field(description="What the family can spend on education each year")
    savings: Rupees = Field(description="Savings set aside for education")
    max_loan: Rupees = Field(description="Largest education loan the family will take")
    annual_income: Rupees | None = Field(default=None, description="Optional; used only to match scholarship income limits")
    risk_appetite: RiskLevel
    breakeven_tolerance_years: int = Field(ge=1, le=20, description="Years of salary the family accepts to recover the cost")
    preferred_state: IndianState
    open_to_abroad: bool
    top_domain_ids: list[UUID] = Field(
        min_length=3, max_length=3, description="The parent's top 3 domains (ids from GET /domains), first choice first"
    )

    @field_validator("top_domain_ids")
    @classmethod
    def _three_different_domains(cls, ids: list[UUID]) -> list[UUID]:
        if len(set(ids)) != len(ids):
            raise ValueError("Pick three different domains.")
        return ids


class StudentProfile(StrictModel):
    role: Literal[Role.STUDENT]
    risk_appetite: RiskLevel
    preferred_state: IndianState = Field(description="Where the student would like to study and work")
    open_to_abroad: bool
    home_state: IndianState = Field(description="State of residence; used for state scholarships")
    category: Literal["general", "obc", "sc", "st", "ews"] | None = Field(
        default=None, description="Optional; used only for scholarship rules"
    )
    percentage: float | None = Field(
        default=None, ge=0, le=100, description="Latest board exam percentage; optional, used for merit scholarships"
    )
    gender: Literal["female", "male", "other"] | None = Field(
        default=None, description="Optional; some scholarships are for girls only"
    )


Profile = Annotated[ParentProfile | StudentProfile, Field(discriminator="role")]
