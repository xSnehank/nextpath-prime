"""The mock roadmap obeys the backend-guide formulas, so the numbers shown on
screen and on slides add up. Branch 8 runs the same checks on real responses."""

from app.schemas.analyze import AnalyzeResponse
from tests.helpers import AS_STUDENT, PAIR, assert_analyze_invariants, make_client


def _mock_result() -> AnalyzeResponse:
    response = make_client().post("/analyze", headers=AS_STUDENT, json=PAIR)
    return AnalyzeResponse.model_validate(response.json())


def test_mock_roadmap_obeys_the_formulas() -> None:
    assert_analyze_invariants(_mock_result())


def test_mock_shows_every_ui_state() -> None:
    """The frontend needs at least one of each case to build its screens against."""
    result = _mock_result()
    assert len(result.roadmap) == 5
    non_viable = [item for item in result.roadmap if not item.finance.viable]
    assert non_viable and non_viable[0].cheaper_alternative, "a non-viable path with a cheaper alternative"
    assert result.rejected, "a rejected career"
    assert any(item.market.data_quality == "estimated" for item in result.roadmap), "a national-fallback market figure"
    assert any(item.scholarships for item in result.roadmap) and any(not item.scholarships for item in result.roadmap)
    assert any(item.finance.loan_needed > 0 for item in result.roadmap), "a viable path that still needs a loan"


def test_mock_text_never_names_real_institutions() -> None:
    result = _mock_result()
    for item in result.roadmap:
        assert all(college.name.startswith("Sample ") for college in item.path.colleges)
        assert all("(MOCK)" in scholarship.name for scholarship in item.scholarships)
        assert item.market.source.startswith("MOCK")
