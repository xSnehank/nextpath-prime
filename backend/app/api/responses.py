from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses
from app.repositories import assessment
from app.schemas.common import ErrorCode
from app.schemas.questions import QuestionSet
from app.schemas.responses import ResponsesBatch, ResponsesSaved
from app.services.progress import progress_for

router = APIRouter(tags=["assessment"])


@router.post(
    "/responses",
    response_model=ResponsesSaved,
    responses=error_responses(401, 422),
    summary="Save your answers (batch; re-sending a question overwrites it)",
)
def save_responses(body: ResponsesBatch, user: CurrentUserDep, settings: SettingsDep, conn: ConnDep) -> ResponsesSaved:
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

    # Each question accepts only its own option values (1-5 for likert, 1-4 for a 4-option choice question).
    allowed = {row.id: {option["value"] for option in row.options} for row in assessment.list_questions(conn, user.role.value)}
    unknown = sorted({str(answer.question_id) for answer in body.answers if answer.question_id not in allowed})
    if unknown:
        raise AppError(
            ErrorCode.VALIDATION_ERROR, "Some question ids are not in your question set.", {"unknown_question_ids": unknown}
        )
    invalid = sorted({str(a.question_id) for a in body.answers if a.value not in allowed[a.question_id]})
    if invalid:
        raise AppError(
            ErrorCode.VALIDATION_ERROR, "Some answers are not one of the question's options.", {"invalid_question_ids": invalid}
        )
    latest = {answer.question_id: answer.value for answer in body.answers}  # the last answer per question wins
    assessment.save_answers(conn, user.id, latest.items())
    progress = progress_for(conn, user.id, user.role)
    return ResponsesSaved(
        saved=len(latest),
        answered=progress.questions_answered,
        required=progress.questions_required,
        complete=progress.questions_answered >= progress.questions_required,
    )
