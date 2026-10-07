"""The template explanation (backend guide, section 6): the same facts as Gemini would get, fixed wording."""

from jinja2 import Environment, StrictUndefined

from app.core.scholarships import rupees_text
from app.schemas.analyze import RoadmapItem

TEMPLATE = (
    "{{ career }} fits you with a score of {{ fit_100 }}/100. The estimated family cost is Rs {{ total_cost }}, "
    "with a loan need of Rs {{ loan_needed }} and a payback time of about {{ breakeven }} years. "
    "Demand in {{ region }} is {{ demand_label }} (data as of {{ as_of }}). {{ caution }}"
)
_template = Environment(undefined=StrictUndefined, autoescape=False).from_string(TEMPLATE)

REASON_TEXT = {
    "LOAN_EXCEEDS_LIMIT": "it needs a bigger loan than the family's limit",
    "BREAKEVEN_TOO_LONG": "it takes longer to pay back than the family is comfortable with",
    "COST_EXCEEDS_CAPACITY": "it costs more than the family can pay without a loan",
}


def demand_label(demand_index: float) -> str:
    """demand_index is 0..1."""
    return "high" if demand_index >= 0.7 else "moderate" if demand_index >= 0.4 else "low"


def caution(item: RoadmapItem) -> str:
    if not item.finance.viable:
        reasons = [REASON_TEXT[reason] for reason in item.finance.reasons if reason in REASON_TEXT]
        return "This path isn't affordable as planned: " + " and ".join(reasons) + "."
    if item.market.data_quality == "estimated":
        return "Some of these figures are estimates, so treat them as a guide."
    return ""


def facts(item: RoadmapItem) -> dict[str, str | int]:
    """The only facts an explanation may use, already formatted for reading."""
    return {
        "career": item.career,
        "fit_100": round(item.scores.fit * 100),
        "total_cost": rupees_text(item.finance.total_cost),
        "loan_needed": rupees_text(item.finance.loan_needed),
        "breakeven": f"{item.finance.breakeven_years:.1f}",
        "region": item.market.region,
        "demand_label": demand_label(item.market.demand_index),
        "demand_100": round(item.market.demand_index * 100),
        "as_of": item.market.as_of.isoformat(),
        "viable": "yes" if item.finance.viable else "no",
        "data_quality": item.market.data_quality,
        "caution": caution(item),
    }


def render(item: RoadmapItem) -> str:
    return _template.render(**facts(item)).strip()
