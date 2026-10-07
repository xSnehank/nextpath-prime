"""Read-only reference data: domains, careers, courses, routes, market data, living costs, scholarships."""

from uuid import UUID

from sqlalchemy import Row, text
from sqlalchemy.engine import Connection


def list_domains(conn: Connection) -> list[Row]:
    return list(conn.execute(text("SELECT id, name, description FROM domains ORDER BY id")))


def existing_domain_ids(conn: Connection, ids: list[UUID]) -> set[UUID]:
    return set(conn.execute(text("SELECT id FROM domains WHERE id = ANY(:ids)"), {"ids": ids}).scalars())


def list_careers(conn: Connection) -> list[Row]:
    return list(
        conn.execute(
            text(
                """
                SELECT c.id, c.name, c.education_path, c.trait_weights, d.id AS domain_id, d.name AS domain
                FROM careers c JOIN domains d ON d.id = c.domain_id ORDER BY c.id
                """
            )
        )
    )


def get_career(conn: Connection, career_id: UUID) -> Row | None:
    return conn.execute(
        text(
            """
            SELECT c.id, c.name, d.name AS domain FROM careers c JOIN domains d ON d.id = c.domain_id
            WHERE c.id = :id
            """
        ),
        {"id": career_id},
    ).first()


def list_routes(conn: Connection) -> list[Row]:
    """Every exam + college route with its course, undergraduate courses first."""
    return list(
        conn.execute(
            text(
                """
                SELECT co.career_id, co.name AS course, co.level, co.duration_years, ec.exam, ec.college, ec.state,
                       ec.annual_fee, ec.annual_living_cost, ec.estimated
                FROM exams_colleges ec JOIN courses co ON co.id = ec.course_id
                ORDER BY co.career_id, co.level DESC, ec.college
                """
            )
        )
    )


def list_market_data(conn: Connection, career_ids: list[UUID] | None = None) -> list[Row]:
    """The latest row per career and region."""
    return list(
        conn.execute(
            text(
                """
                SELECT DISTINCT ON (career_id, region)
                       career_id, region, demand_index, growth_rate, median_salary, entry_salary, as_of, source,
                       estimated
                FROM market_data
                WHERE CAST(:ids AS uuid[]) IS NULL OR career_id = ANY(CAST(:ids AS uuid[]))
                ORDER BY career_id, region, as_of DESC
                """
            ),
            {"ids": career_ids},
        )
    )


def living_costs(conn: Connection) -> dict[str, Row]:
    """Monthly living cost by region name ('India' = the national figure)."""
    return {
        row.name: row
        for row in conn.execute(text("SELECT name, monthly_living_cost, source, as_of, estimated FROM regions"))
    }


def list_scholarships(conn: Connection) -> list[Row]:
    """Every scholarship with the careers it applies to."""
    return list(
        conn.execute(
            text(
                """
                SELECT s.name, s.amount, s.amount_period, s.deadline, s.income_limit, s.min_percentage, s.gender,
                       s.course_level,
                       -- psycopg doesn't know arrays of our domain types and would return the text '{...}'
                       CAST(s.categories AS text[]) AS categories, CAST(s.states AS text[]) AS states,
                       coalesce(array_agg(sc.career_id) FILTER (WHERE sc.career_id IS NOT NULL), '{}') AS career_ids
                FROM scholarships s LEFT JOIN scholarship_careers sc ON sc.scholarship_id = s.id
                GROUP BY s.id ORDER BY s.name
                """
            )
        )
    )
