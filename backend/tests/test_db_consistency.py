"""The database's fixed lists match the backend's, so a value the API accepts is never refused by the database
(and the other way round). Reads the SQL files in db/; nothing connects to a database."""

import re
from pathlib import Path
from typing import Any, get_args

from app.mocks import read
from app.schemas.common import DIMENSION_GROUP, IndianState, Role, SchoolStream
from app.schemas.profile import StudentProfile

DB_DIR = Path(__file__).resolve().parents[2] / "db"
MIGRATION = "\n".join(p.read_text(encoding="utf-8") for p in sorted((DB_DIR / "migrations").glob("*.sql")))
CAREERS_SEED = (DB_DIR / "seed" / "02_careers_courses.sql").read_text(encoding="utf-8")


def _domain_values(name: str) -> set[str]:
    """The quoted values in CREATE DOMAIN <name> AS TEXT CHECK (VALUE IN (...))."""
    match = re.search(rf"CREATE DOMAIN {name} AS TEXT CHECK \(VALUE IN \((.*?)\)\);", MIGRATION, re.DOTALL)
    assert match, f"domain {name} not found in db/migrations"
    return set(re.findall(r"'([^']+)'", match.group(1)))


def _literal_values(annotation: Any) -> set[str]:
    """The strings in an annotation like Literal["a", "b"] | None."""
    return {value for arg in get_args(annotation) for value in get_args(arg) if isinstance(value, str)}


def test_states_match_indian_state() -> None:
    assert _domain_values("region_name") == {"India"} | {state.value for state in IndianState}


def test_roles_match() -> None:
    assert _domain_values("user_role") == {role.value for role in Role}


def test_streams_match() -> None:
    assert _domain_values("school_stream") == {stream.value for stream in SchoolStream}


def test_scholarship_fields_match_the_student_profile() -> None:
    fields = StudentProfile.model_fields
    assert _domain_values("social_category") == _literal_values(fields["category"].annotation)
    assert _domain_values("gender_type") == _literal_values(fields["gender"].annotation)


def test_trait_dimensions_and_groups_match() -> None:
    in_sql = set(re.findall(r"\('(aptitude|interest|cognitive)', '(\w+)'\)", MIGRATION))
    assert in_sql == {(group.value, dimension.value) for dimension, group in DIMENSION_GROUP.items()}


def test_seeded_domains_match_the_mock() -> None:
    """The frontend gets the same ids and names from the mock server as from the real one."""
    seeded = re.findall(r"\('(d0000000-[0-9a-f-]+)', '([^']+)', '([^']+)'\)", CAREERS_SEED)
    assert seeded == [(d["id"], d["name"], d["description"]) for d in read("domains")]
