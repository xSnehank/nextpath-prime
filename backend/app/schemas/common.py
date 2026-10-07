"""Contract types shared by several endpoints: base model, error body, enums,
score and money types, and the ranking weights."""

from enum import StrEnum
from typing import Annotated, Any, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic_core import PydanticCustomError


class StrictModel(BaseModel):
    """Base for every contract model. Unknown fields are rejected, so a typo in a
    request or in a mock file fails loudly instead of being silently dropped."""

    model_config = ConfigDict(extra="forbid")


# ---------- errors ----------


class ErrorCode(StrEnum):
    UNAUTHENTICATED = "UNAUTHENTICATED"  # 401
    FORBIDDEN = "FORBIDDEN"  # 403
    NOT_FOUND = "NOT_FOUND"  # 404
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"  # 405
    ASSESSMENT_INCOMPLETE = "ASSESSMENT_INCOMPLETE"  # 409
    CONSENT_REQUIRED = "CONSENT_REQUIRED"  # 409
    INVALID_WEIGHTS = "INVALID_WEIGHTS"  # 422
    VALIDATION_ERROR = "VALIDATION_ERROR"  # 422
    INTERNAL_ERROR = "INTERNAL_ERROR"  # 500
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"  # 501, only until each endpoint's branch lands
    UPSTREAM_UNAVAILABLE = "UPSTREAM_UNAVAILABLE"  # 503, the database or Supabase sign-in


class ErrorDetail(StrictModel):
    code: ErrorCode
    message: str
    details: dict[str, Any]


class ErrorBody(StrictModel):
    """Every error response has this shape."""

    error: ErrorDetail


# ---------- people and traits ----------


class Role(StrEnum):
    STUDENT = "student"
    PARENT = "parent"


class TraitGroup(StrEnum):
    APTITUDE = "aptitude"
    INTEREST = "interest"
    COGNITIVE = "cognitive"


class Dimension(StrEnum):
    """The 13 trait dimensions. Question dimensions and careers.trait_weights keys use exactly these values."""

    # aptitude
    LOGICAL = "logical"
    NUMERICAL = "numerical"
    VERBAL = "verbal"
    SPATIAL = "spatial"
    CREATIVE = "creative"
    # interest (the six Holland types)
    REALISTIC = "realistic"
    INVESTIGATIVE = "investigative"
    ARTISTIC = "artistic"
    SOCIAL = "social"
    ENTERPRISING = "enterprising"
    CONVENTIONAL = "conventional"
    # cognitive style: high = analytical / structured, low = intuitive / flexible
    ANALYTICAL = "analytical"
    STRUCTURED = "structured"


DIMENSION_GROUP: dict[Dimension, TraitGroup] = {
    **dict.fromkeys(
        [Dimension.LOGICAL, Dimension.NUMERICAL, Dimension.VERBAL, Dimension.SPATIAL, Dimension.CREATIVE],
        TraitGroup.APTITUDE,
    ),
    **dict.fromkeys(
        [
            Dimension.REALISTIC,
            Dimension.INVESTIGATIVE,
            Dimension.ARTISTIC,
            Dimension.SOCIAL,
            Dimension.ENTERPRISING,
            Dimension.CONVENTIONAL,
        ],
        TraitGroup.INTEREST,
    ),
    **dict.fromkeys([Dimension.ANALYTICAL, Dimension.STRUCTURED], TraitGroup.COGNITIVE),
}


class IndianState(StrEnum):
    """States and union territories, spelled exactly like this everywhere (profiles, market data)."""

    ANDHRA_PRADESH = "Andhra Pradesh"
    ARUNACHAL_PRADESH = "Arunachal Pradesh"
    ASSAM = "Assam"
    BIHAR = "Bihar"
    CHHATTISGARH = "Chhattisgarh"
    GOA = "Goa"
    GUJARAT = "Gujarat"
    HARYANA = "Haryana"
    HIMACHAL_PRADESH = "Himachal Pradesh"
    JHARKHAND = "Jharkhand"
    KARNATAKA = "Karnataka"
    KERALA = "Kerala"
    MADHYA_PRADESH = "Madhya Pradesh"
    MAHARASHTRA = "Maharashtra"
    MANIPUR = "Manipur"
    MEGHALAYA = "Meghalaya"
    MIZORAM = "Mizoram"
    NAGALAND = "Nagaland"
    ODISHA = "Odisha"
    PUNJAB = "Punjab"
    RAJASTHAN = "Rajasthan"
    SIKKIM = "Sikkim"
    TAMIL_NADU = "Tamil Nadu"
    TELANGANA = "Telangana"
    TRIPURA = "Tripura"
    UTTAR_PRADESH = "Uttar Pradesh"
    UTTARAKHAND = "Uttarakhand"
    WEST_BENGAL = "West Bengal"
    ANDAMAN_AND_NICOBAR_ISLANDS = "Andaman and Nicobar Islands"
    CHANDIGARH = "Chandigarh"
    DADRA_NAGAR_HAVELI_DAMAN_DIU = "Dadra and Nagar Haveli and Daman and Diu"
    DELHI = "Delhi"
    JAMMU_AND_KASHMIR = "Jammu and Kashmir"
    LADAKH = "Ladakh"
    LAKSHADWEEP = "Lakshadweep"
    PUDUCHERRY = "Puducherry"


# A market-data region: one state, or "India" for the national figure used as a fallback.
Region = IndianState | Literal["India"]

# ---------- numbers ----------

Score = Annotated[float, Field(ge=0, le=1, description="0..1")]
Score100 = Annotated[int, Field(ge=0, le=100, description="0..100, for display")]
Rupees = Annotated[int, Field(ge=0, description="Whole rupees")]
RiskLevel = Annotated[int, Field(ge=1, le=5, description="1 = avoids risk ... 5 = very comfortable with risk")]
DataQuality = Literal["sourced", "estimated"]

# ---------- ranking weights ----------

# How far fit + finance + market may drift from exactly 1 before the weights are rejected.
# 0.01 accepts what 2-decimal sliders send (0.33 x 3 = 0.99) and float noise (0.1 + 0.2 + 0.7), but rejects
# 0.98 or 1.05, where every final score would silently shrink or grow by several percent.
WEIGHT_SUM_TOLERANCE: float = 0.01


class Weights(StrictModel):
    """Weights for the final ranking R = fit*S + finance*F + market*M (backend guide, section 4, step 5)."""

    fit: float = Field(ge=0, le=1)
    finance: float = Field(ge=0, le=1)
    market: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def _must_sum_to_one(self) -> Self:
        """Reject weights whose sum is further than WEIGHT_SUM_TOLERANCE from 1.

        app/errors.py turns this error into INVALID_WEIGHTS; {sum} is filled in from the dict below, which is
        also returned to the frontend in error.details.
        """
        total = round(self.fit + self.finance + self.market, 6)
        if abs(total - 1) > WEIGHT_SUM_TOLERANCE:
            raise PydanticCustomError("invalid_weights", "The weights add up to {sum}; they must add up to 1.", {"sum": total})
        return self


DEFAULT_WEIGHTS = Weights(fit=0.45, finance=0.30, market=0.25)
