"""Gemini explanations (backend guide, section 6). Only the backend calls Gemini; the key is never logged.

The text is accepted only if it's under 150 words, has no markdown headings, and every number in it appears
in the data it was given. Otherwise the caller falls back to the template.
"""

import json
import logging
import re

from google import genai
from google.genai import types

from app.config import Settings

logger = logging.getLogger("prism.explain")

PROMPT = """You explain career recommendations to a student and their parent in simple, kind language.
Use ONLY the data in the JSON below. Do not add salaries, colleges, exams or statistics that are not in it.
In under 150 words: (1) why this career fits the student, citing the fit score; (2) whether it is affordable, citing cost, loan and break-even years; (3) how much demand there is in the region, citing the demand index and the data date; (4) one honest caution if the path is not viable or the data is estimated.
Write one paragraph for the student and one short paragraph addressed to the parent. No bullet points.
DATA: {json}"""

MAX_WORDS = 150
SCALE_NUMBERS = {"100"}  # "78/100": the scale itself isn't a fact Gemini could invent
TIMEOUT_MS = 8_000
_NUMBER = re.compile(r"\d[\d,]*(?:\.\d+)?")


def numbers_in(text: str) -> set[str]:
    """Every number written in the text, without thousands separators or trailing zeros ('2.50' -> '2.5')."""
    found = set()
    for raw in _NUMBER.findall(text):
        number = raw.replace(",", "").rstrip(".")
        if "." in number:
            number = number.rstrip("0").rstrip(".")
        found.add(number)
    return found


def acceptable(text: str, facts: dict) -> bool:
    if not text or len(text.split()) >= MAX_WORDS:
        return False
    if any(line.lstrip().startswith("#") for line in text.splitlines()):
        return False
    allowed = numbers_in(json.dumps(facts, ensure_ascii=False)) | SCALE_NUMBERS
    return numbers_in(text) <= allowed


def generate(facts: dict, settings: Settings) -> str | None:
    """Gemini's text, or None if it failed, timed out or wrote something we can't check."""
    if settings.gemini_api_key is None or not settings.gemini_model:
        return None
    client = genai.Client(
        api_key=settings.gemini_api_key.get_secret_value(), http_options=types.HttpOptions(timeout=TIMEOUT_MS)
    )
    prompt = PROMPT.format(json=json.dumps(facts, ensure_ascii=False))
    for attempt in (1, 2):  # one retry on a transient error
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=400),
            )
        except Exception as error:  # the SDK raises several types; any failure means "use the template"
            logger.warning("Gemini call failed (attempt %s): %s", attempt, type(error).__name__)
            continue
        text = (response.text or "").strip()
        if acceptable(text, facts):
            return text
        logger.warning("Gemini text rejected by the checks")
        return None
    return None
