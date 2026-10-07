"""Step 8: which scholarships does the family qualify for? (backend guide, section 4)

A scholarship matches only when every rule it has is met. A rule the family's profile can't answer (for
example an income limit when no income was given) counts as not met: we never assume eligibility.
Only the single most valuable match reduces the cost, because schemes usually can't be combined.
"""

from app.core.inputs import Parent, Scholarship, Student


def rupees_text(amount: int) -> str:
    """Indian digit grouping: 800000 -> '8,00,000'."""
    digits = str(amount)
    if len(digits) <= 3:
        return digits
    head, tail = digits[:-3], digits[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    return ",".join([head, *groups, tail]) if head else ",".join([*groups, tail])


def matched_rule(scholarship: Scholarship, student: Student, parent: Parent, level: str) -> str | None:
    """The rules the family met, in words; None when any rule fails."""
    met: list[str] = []
    if scholarship.course_level is not None:
        if scholarship.course_level != level:
            return None
        met.append(f"{level} course")
    if scholarship.income_limit is not None:
        if parent.annual_income is None or parent.annual_income > scholarship.income_limit:
            return None
        met.append(f"family income up to Rs {rupees_text(scholarship.income_limit)}")
    if scholarship.categories:
        if student.category not in scholarship.categories:
            return None
        met.append(f"category {student.category.upper()}")
    if scholarship.states:
        if student.home_state not in scholarship.states:
            return None
        met.append(f"home state {student.home_state}")
    if scholarship.min_percentage is not None:
        if student.percentage is None or student.percentage < scholarship.min_percentage:
            return None
        met.append(f"marks of at least {scholarship.min_percentage:g}%")
    if scholarship.gender is not None:
        if student.gender != scholarship.gender:
            return None
        met.append({"female": "for girls", "male": "for boys"}.get(scholarship.gender, f"gender {scholarship.gender}"))
    return "; ".join(met) or "open to all students"


def total_value(scholarship: Scholarship, duration_years: float) -> int:
    """What it's worth over the course: a yearly award is paid every year of the course."""
    if scholarship.amount_period == "per_year":
        return round(scholarship.amount * duration_years)
    return scholarship.amount
