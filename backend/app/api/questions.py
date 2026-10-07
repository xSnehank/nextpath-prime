from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import CurrentUserDep, SettingsDep
from app.errors import error_responses
from app.repositories import assessment
from app.schemas.common import DIMENSION_GROUP, Dimension, Role
from app.schemas.questions import AnswerOption, Question, QuestionSet

router = APIRouter(tags=["assessment"])


@router.get(
    "/questions",
    response_model=QuestionSet,
    responses=error_responses(401, 422),
    summary="The question set for students or parents",
)
def get_questions(audience: Role, _user: CurrentUserDep, settings: SettingsDep, conn: ConnDep) -> QuestionSet:
    if settings.use_mocks:
        return mocks.load(f"questions_{audience.value}", QuestionSet)
    # The answer key and the reverse-scored flag never leave the server.
    return QuestionSet(
        audience=audience,
        questions=[
            Question(
                id=row.id,
                kind=row.kind,
                group=DIMENSION_GROUP[Dimension(row.dimension)],
                dimension=Dimension(row.dimension),
                text=row.text,
                options=[AnswerOption(value=option["value"], label=option["label"]) for option in row.options],
                required=row.required,
            )
            for row in assessment.list_questions(conn, audience.value)
        ],
    )
