"""Profiles (what PUT /profile saves), the parent's top domains, and consent."""

from uuid import UUID

from sqlalchemy import Row, text
from sqlalchemy.engine import Connection

from app.schemas.profile import ParentProfile, StudentProfile


def get_profile(conn: Connection, user_id: UUID) -> Row | None:
    return conn.execute(text("SELECT * FROM profiles WHERE user_id = :id"), {"id": user_id}).first()


def get_top_domain_ids(conn: Connection, parent_id: UUID) -> list[UUID]:
    """The parent's picks, first choice first."""
    return list(
        conn.execute(
            text("SELECT domain_id FROM parent_domain_prefs WHERE parent_id = :id ORDER BY rank"), {"id": parent_id}
        ).scalars()
    )


def save_student_profile(conn: Connection, user_id: UUID, profile: StudentProfile) -> None:
    conn.execute(
        text(
            """
            INSERT INTO profiles (user_id, stream, risk_appetite, preferred_state, open_to_abroad, home_state,
                                  category, percentage, gender)
            VALUES (:user_id, :stream, :risk_appetite, :preferred_state, :open_to_abroad, :home_state,
                    :category, :percentage, :gender)
            ON CONFLICT (user_id) DO UPDATE SET
                stream = EXCLUDED.stream, risk_appetite = EXCLUDED.risk_appetite,
                preferred_state = EXCLUDED.preferred_state, open_to_abroad = EXCLUDED.open_to_abroad,
                home_state = EXCLUDED.home_state, category = EXCLUDED.category,
                percentage = EXCLUDED.percentage, gender = EXCLUDED.gender
            """
        ),
        {"user_id": user_id} | profile.model_dump(mode="json", exclude={"role"}),
    )


def save_parent_profile(conn: Connection, user_id: UUID, profile: ParentProfile) -> None:
    values = profile.model_dump(mode="json", exclude={"role", "top_domain_ids"})
    conn.execute(
        text(
            """
            INSERT INTO profiles (user_id, annual_education_budget, savings, max_loan, annual_income, risk_appetite,
                                  breakeven_tolerance_years, preferred_state, open_to_abroad)
            VALUES (:user_id, :annual_education_budget, :savings, :max_loan, :annual_income, :risk_appetite,
                    :breakeven_tolerance_years, :preferred_state, :open_to_abroad)
            ON CONFLICT (user_id) DO UPDATE SET
                annual_education_budget = EXCLUDED.annual_education_budget, savings = EXCLUDED.savings,
                max_loan = EXCLUDED.max_loan, annual_income = EXCLUDED.annual_income,
                risk_appetite = EXCLUDED.risk_appetite, breakeven_tolerance_years = EXCLUDED.breakeven_tolerance_years,
                preferred_state = EXCLUDED.preferred_state, open_to_abroad = EXCLUDED.open_to_abroad
            """
        ),
        {"user_id": user_id} | values,
    )
    conn.execute(text("DELETE FROM parent_domain_prefs WHERE parent_id = :id"), {"id": user_id})
    conn.execute(
        text("INSERT INTO parent_domain_prefs (parent_id, rank, domain_id) VALUES (:parent_id, :rank, :domain_id)"),
        [
            {"parent_id": user_id, "rank": rank, "domain_id": domain_id}
            for rank, domain_id in enumerate(profile.top_domain_ids, start=1)
        ],
    )


def set_consent(conn: Connection, user_id: UUID, agree: bool) -> Row:
    """Agreeing again keeps the first agreement time; withdrawing clears it."""
    return conn.execute(
        text(
            """
            INSERT INTO profiles (user_id, consent_to_compare, consent_at)
            VALUES (:user_id, :agree, CASE WHEN :agree THEN now() END)
            ON CONFLICT (user_id) DO UPDATE SET
                consent_to_compare = EXCLUDED.consent_to_compare,
                consent_at = CASE WHEN EXCLUDED.consent_to_compare THEN coalesce(profiles.consent_at, now()) END
            RETURNING consent_to_compare, consent_at
            """
        ),
        {"user_id": user_id, "agree": agree},
    ).one()
