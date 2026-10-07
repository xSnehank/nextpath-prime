"""The demo family (db/seed/03_demo_family.sql) that judges can open without signing in, while DEMO_ENABLED=true.

It uses the same ids as the mock family, so the frontend behaves the same in mock and live mode.
"""

from uuid import UUID

from app.mocks import MOCK_PARENT_ID, MOCK_STUDENT_ID

DEMO_STUDENT_ID = MOCK_STUDENT_ID
DEMO_PARENT_ID = MOCK_PARENT_ID


def is_demo_pair(student_id: UUID, parent_id: UUID) -> bool:
    return (student_id, parent_id) == (DEMO_STUDENT_ID, DEMO_PARENT_ID)
