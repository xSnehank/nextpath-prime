"""POST /explain: cache, then Gemini, then the template, so an explanation never blocks the demo.

Gemini texts are cached in the explanations table. Template texts aren't cached (they're instant), and after a
Gemini failure the template is used for 60 seconds before Gemini is tried again.
"""

import time
from uuid import UUID

from sqlalchemy.engine import Connection

from app.config import Settings
from app.repositories import results
from app.schemas.analyze import RoadmapItem
from app.schemas.explain import ExplainResponse
from app.services.explain import gemini, template

RETRY_AFTER_SECONDS = 60
_failed_at: dict[tuple[UUID, UUID], float] = {}


def explain(conn: Connection, settings: Settings, result_id: UUID, item: RoadmapItem) -> ExplainResponse:
    def answer(text: str, source: str) -> ExplainResponse:
        return ExplainResponse(career_id=item.career_id, text=text, source=source)

    model = settings.gemini_model
    if settings.explain_mode != "gemini" or not model:
        return answer(template.render(item), "template")

    cached = results.get_explanation(conn, result_id, item.career_id, model)
    if cached is not None:
        return answer(cached, "cache")

    key = (result_id, item.career_id)
    if time.monotonic() - _failed_at.get(key, float("-inf")) < RETRY_AFTER_SECONDS:
        return answer(template.render(item), "template")
    text = gemini.generate(template.facts(item), settings)
    if text is None:
        _failed_at[key] = time.monotonic()
        return answer(template.render(item), "template")
    results.save_explanation(conn, result_id, item.career_id, model, text, "gemini")
    return answer(text, "gemini")
