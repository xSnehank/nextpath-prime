"""Unit tests for step 0 (streams), the typical-college cost and the stream-aware ranking, worked out by hand
(backend guide, section 4)."""

from uuid import UUID

import pytest

from app.core import finance, ranking, streams
from app.schemas.common import DEFAULT_WEIGHTS

PCM, PCB, PCMB, COM_M, COM, ARTS = "science_pcm", "science_pcb", "science_pcmb", "commerce_maths", "commerce", "arts"
SCI_M = (PCM, PCMB)  # B.Tech: Physics and Mathematics (AICTE)
ALL = (PCM, PCB, PCMB, COM_M, COM, ARTS)

# ---------- step 0: which courses a stream opens ----------


def test_btech_is_natural_for_pcm_and_pcmb_and_closed_for_the_rest() -> None:
    assert streams.course_match(PCM, SCI_M, SCI_M) == streams.NATURAL
    assert streams.course_match(PCMB, SCI_M, SCI_M) == streams.NATURAL
    for stream in (PCB, COM_M, COM, ARTS):
        assert streams.course_match(stream, SCI_M, SCI_M) == streams.CLOSED


def test_ca_is_open_to_pcm_but_natural_for_commerce() -> None:
    commerce = (COM, COM_M)
    assert streams.course_match(PCM, ALL, commerce) == streams.OPEN
    assert streams.course_match(ARTS, ALL, commerce) == streams.OPEN
    assert streams.course_match(COM, ALL, commerce) == streams.NATURAL
    assert streams.course_match(COM_M, ALL, commerce) == streams.NATURAL


def test_undecided_student_is_natural_for_every_course_even_a_closed_one() -> None:
    # A Class 10 student can still pick any stream, so nothing is closed to them.
    assert streams.course_match(streams.UNDECIDED, SCI_M, SCI_M) == streams.NATURAL
    assert streams.course_match(streams.UNDECIDED, (PCB, PCMB), (PCB, PCMB)) == streams.NATURAL


def test_a_career_takes_its_best_course() -> None:
    # Data Scientist for Commerce-with-Maths: B.Tech closed, B.Stat open, B.Sc Data Science natural -> natural
    assert streams.best_match([streams.CLOSED, streams.OPEN, streams.NATURAL]) == streams.NATURAL
    assert streams.best_match([streams.CLOSED, streams.OPEN]) == streams.OPEN
    assert streams.best_match([streams.CLOSED]) == streams.CLOSED
    assert streams.best_match([]) == streams.CLOSED  # no courses at all


# ---------- step 3: the typical college ----------


def _opts(*rows: tuple[int, str]) -> list[tuple[int, str]]:
    """(total cost, state) pairs, cheapest first, as evaluate() passes them."""
    return sorted(rows)


def test_typical_is_the_lower_median_of_the_preferred_state() -> None:
    options = _opts((10, "Karnataka"), (50, "Delhi"), (20, "Karnataka"), (90, "Karnataka"), (5, "Delhi"))
    # Karnataka routes by cost: 10, 20, 90 -> 3 routes, lower median = index (3 - 1) // 2 = 1 -> 20
    assert finance.typical_option(options, lambda state: state == "Karnataka") == (20, "Karnataka")


def test_typical_takes_the_lower_of_the_two_middle_routes() -> None:
    options = _opts((10, "Goa"), (20, "Goa"), (30, "Goa"), (40, "Goa"))
    # 4 routes: index (4 - 1) // 2 = 1 -> 20 (not the average of 20 and 30: it must be a real college)
    assert finance.typical_option(options, lambda state: state == "Goa") == (20, "Goa")


def test_typical_falls_back_to_all_routes_when_the_state_has_none() -> None:
    options = _opts((10, "Delhi"), (30, "Kerala"), (70, "Punjab"), (90, "Delhi"), (200, "Bihar"))
    # no Assam route: all 5, index (5 - 1) // 2 = 2 -> 70 (the cheapest, 10, would make it look nearly free)
    assert finance.typical_option(options, lambda state: state == "Assam") == (70, "Punjab")


def test_typical_with_one_or_two_routes() -> None:
    assert finance.typical_option([(500, "Delhi")], lambda s: False) == (500, "Delhi")  # index 0
    assert finance.typical_option(_opts((300, "Delhi"), (100, "Delhi")), lambda s: True) == (100, "Delhi")  # index 0


def test_typical_needs_a_route() -> None:
    with pytest.raises(ValueError):
        finance.typical_option([], lambda s: True)


# ---------- step 5: own-stream careers first ----------


def _cand(name: str, final: float, viable: bool = True, natural: bool = True) -> ranking.Candidate:
    # fit = finance = market = final, so R = 0.45 x final + 0.30 x final + 0.25 x final = final
    return ranking.Candidate(UUID(int=sum(map(ord, name))), final, final, final, viable, natural)


def test_open_careers_never_rank_above_own_stream_ones() -> None:
    engineering = _cand("Mechanical", 0.40)
    ca = _cand("CA", 0.95, natural=False)  # a far better score, but it isn't the PCM student's stream
    roadmap, _ = ranking.rank([ca, engineering], DEFAULT_WEIGHTS)
    assert [c.career_id for c in roadmap] == [engineering.career_id, ca.career_id]


def test_group_order_is_natural_viable_then_natural_not_viable_then_open() -> None:
    nv = _cand("own, viable", 0.30)
    nn = _cand("own, not viable", 0.90, viable=False)
    ov = _cand("open, viable", 0.99, natural=False)
    on = _cand("open, not viable", 0.99, viable=False, natural=False)
    roadmap, rejected = ranking.rank([on, ov, nn, nv], DEFAULT_WEIGHTS)
    assert [c.career_id for c in roadmap] == [nv.career_id, nn.career_id, ov.career_id, on.career_id]
    assert rejected == []  # everything fits in the top 5


def test_rejected_lists_only_own_stream_careers_that_failed_the_money_check() -> None:
    own_viable = [_cand(f"own {i}", 0.5 + i / 100) for i in range(5)]
    own_failed = _cand("own failed", 0.99, viable=False)
    open_failed = _cand("open failed", 0.99, viable=False, natural=False)
    roadmap, rejected = ranking.rank([*own_viable, own_failed, open_failed], DEFAULT_WEIGHTS)
    assert len(roadmap) == 5 and all(c.natural and c.viable for c in roadmap)
    assert rejected == [own_failed]  # the open career that failed isn't the student's concern


def test_without_streams_the_ranking_is_unchanged() -> None:
    # Every candidate natural (the default): viable first, then by R, as before step 0 existed.
    a, b, c = _cand("a", 0.5), _cand("b", 0.9, viable=False), _cand("c", 0.7)
    roadmap, rejected = ranking.rank([a, b, c], DEFAULT_WEIGHTS)
    assert [x.career_id for x in roadmap] == [c.career_id, a.career_id, b.career_id]
    assert rejected == []
