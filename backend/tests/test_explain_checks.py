"""The checks a Gemini explanation must pass before we show it (backend guide, section 6)."""

from app.services.explain.gemini import acceptable, numbers_in

FACTS = {"career": "Data Scientist", "fit_100": 78, "total_cost": "10,40,000", "breakeven": "2.5", "as_of": "2026-01-15"}


def test_numbers_are_compared_without_separators_or_trailing_zeros() -> None:
    assert numbers_in("Rs 10,40,000 over 2.50 years, fit 78/100") == {"1040000", "2.5", "78", "100"}


def test_text_using_only_supplied_numbers_is_accepted() -> None:
    assert acceptable("Data Scientist fits you at 78/100. It costs Rs 10,40,000 and pays back in 2.5 years.", FACTS)


def test_an_invented_number_is_rejected() -> None:
    assert not acceptable("Data Scientists earn Rs 12,00,000 a year.", FACTS)


def test_headings_and_long_text_are_rejected() -> None:
    assert not acceptable("# Why it fits\nIt fits.", FACTS)
    assert not acceptable("word " * 150, FACTS)
