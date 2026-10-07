"""Question kinds: likert statements are rated 1-5, choice questions are graded right or wrong."""

import pytest
from pydantic import ValidationError

from app.schemas.questions import Question
from tests.helpers import AS_STUDENT, make_client

LIKERT_OPTIONS = [{"value": v, "label": str(v)} for v in range(1, 6)]
FOUR_CHOICES = [{"value": v, "label": label} for v, label in enumerate("ABCD", 1)]


def _question(kind: str, options: list[dict[str, object]]) -> dict[str, object]:
    return {
        "id": "a0000000-0000-4000-8000-000000000099",
        "kind": kind,
        "group": "aptitude",
        "dimension": "logical",
        "text": "?",
        "options": options,
        "required": True,
    }


def test_each_dimension_uses_one_kind_of_question() -> None:
    """Grades (0/1) and ratings (1-5) can't be averaged together (backend guide, section 4, step 1)."""
    questions = make_client().get("/questions?audience=student", headers=AS_STUDENT).json()["questions"]
    kinds: dict[str, set[str]] = {}
    for question in questions:
        kinds.setdefault(question["dimension"], set()).add(question["kind"])
    assert {dimension: found for dimension, found in kinds.items() if len(found) > 1} == {}


@pytest.mark.parametrize(
    ("kind", "options"),
    [
        ("likert", FOUR_CHOICES),  # a likert question needs all five ratings
        ("likert", list(reversed(LIKERT_OPTIONS))),  # in order
        ("choice", FOUR_CHOICES[:1]),  # one option is not a choice
        ("choice", FOUR_CHOICES[1:]),  # numbered from 1
    ],
)
def test_options_must_fit_the_kind(kind: str, options: list[dict[str, object]]) -> None:
    with pytest.raises(ValidationError):
        Question.model_validate(_question(kind, options))


@pytest.mark.parametrize(("kind", "options"), [("likert", LIKERT_OPTIONS), ("choice", FOUR_CHOICES)])
def test_valid_questions_pass(kind: str, options: list[dict[str, object]]) -> None:
    assert Question.model_validate(_question(kind, options)).kind == kind
