"""Mock responses served when USE_MOCKS=true.

Every file is validated against its contract model when loaded, and the tests load
all of them, so a mock can never drift from the real response shape. The numbers
follow docs/backend-guide.md section 4, but the people, colleges and scholarships
are fictional.
"""

import json
from functools import cache
from pathlib import Path
from typing import Any
from uuid import UUID

from pydantic import TypeAdapter

MOCKS_DIR = Path(__file__).parent

# The fictional demo family used by every mock.
MOCK_STUDENT_ID = UUID("11111111-1111-4111-8111-111111111111")
MOCK_PARENT_ID = UUID("22222222-2222-4222-8222-222222222222")
MOCK_RESULT_ID = UUID("33333333-3333-4333-8333-333333333333")


@cache
def read(name: str) -> Any:
    """Raw JSON of app/mocks/<name>.json, read once."""
    return json.loads((MOCKS_DIR / f"{name}.json").read_text(encoding="utf-8"))


def load[T](name: str, shape: type[T]) -> T:
    """The mock, validated against its contract model, so a typo fails loudly."""
    return TypeAdapter(shape).validate_python(read(name))
