"""Step 1: turn answers into a 0..1 score per trait dimension (backend guide, section 4)."""

from collections.abc import Iterable, Mapping
from uuid import UUID

from app.core.inputs import QuestionInfo
from app.schemas.common import Dimension


def answer_score(question: QuestionInfo, value: int) -> float:
    """One answer on the 0..1 scale.

    choice: 1 if the picked option is the correct one, else 0.
    likert: (x - 1) / 4, where x = 6 - value for a reverse-scored statement.
    """
    if question.kind == "choice":
        return 1.0 if value == question.correct_value else 0.0
    x = 6 - value if question.reverse_scored else value
    return (x - 1) / 4


def trait_scores(questions: Iterable[QuestionInfo], answers: Mapping[UUID, int]) -> dict[Dimension, float | None]:
    """t_k = the mean of the answer scores in dimension k; None when no question in k was answered.

    The mean of (x - 1) / 4 equals (mean x - 1) / 4, so this is exactly the guide's formula.
    """
    scores: dict[Dimension, list[float]] = {dimension: [] for dimension in Dimension}
    for question in questions:
        value = answers.get(question.id)
        if value is not None:
            scores[question.dimension].append(answer_score(question, value))
    return {dimension: (sum(values) / len(values) if values else None) for dimension, values in scores.items()}
