"""Step 0: which careers the student's Class 11-12 stream opens, and which come first (backend guide, section 4).

Each course lists the streams that may enter it (the regulator's minimum: B.Tech needs Physics and Mathematics)
and the streams it naturally follows (B.Com follows Commerce). For a student, a course is
    natural  it follows their stream (B.Tech for PCM)
    open     they may enter it, but it isn't their stream's route (CA for PCM)
    closed   they can't enter it (B.Tech for PCB)
A student who hasn't chosen a stream yet ("undecided") can still choose any, so every course is natural.
A career's match is the best over its courses. Closed careers are left out; natural ones rank above open ones.
"""

from collections.abc import Collection, Iterable

NATURAL = "natural"
OPEN = "open"
CLOSED = "closed"
UNDECIDED = "undecided"

_ORDER = {NATURAL: 0, OPEN: 1, CLOSED: 2}


def course_match(stream: str, eligible: Collection[str], primary: Collection[str]) -> str:
    if stream == UNDECIDED or stream in primary:
        return NATURAL
    if stream in eligible:
        return OPEN
    return CLOSED


def best_match(matches: Iterable[str]) -> str:
    """The best of a career's course matches; a career with no courses is closed."""
    return min(matches, key=_ORDER.__getitem__, default=CLOSED)
