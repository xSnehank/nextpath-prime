from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses, not_implemented
from app.schemas.common import ErrorCode
from app.schemas.questions import QuestionSet
from app.schemas.responses import ResponsesBatch, ResponsesSaved

router = APIRouter(tags=["assessment"])


@router.post(
    "/responses",
    response_model=ResponsesSaved,
    responses=error_responses(401, 422),
    summary="Save your answers (batch; re-sending a question overwrites it)",
)
def save_responses(body: ResponsesBatch, user: CurrentUserDep, settings: SettingsDep) -> ResponsesSaved:
    """Mock mode stores nothing, so "answered" counts only the questions in this request."""
    if settings.use_mocks:
        question_set = mocks.load(f"questions_{user.role.value}", QuestionSet)
        known = {question.id for question in question_set.questions}
        unknown = sorted({str(answer.question_id) for answer in body.answers if answer.question_id not in known})
        if unknown:
            raise AppError(
                ErrorCode.VALIDATION_ERROR, "Some question ids are not in your question set.", {"unknown_question_ids": unknown}
            )
        answered = len({answer.question_id for answer in body.answers})
        required = sum(question.required for question in question_set.questions)
        return ResponsesSaved(saved=answered, answered=answered, required=required, complete=answered >= required)
    raise not_implemented("feat/be-B-responses-api")
