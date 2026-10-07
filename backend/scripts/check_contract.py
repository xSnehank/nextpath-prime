"""Export or check the committed API contract, openapi/openapi.json.

Run from backend/:
    python scripts/check_contract.py          # exit 1 if openapi.json is out of date
    python scripts/check_contract.py --write  # regenerate it after changing app/schemas/
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[1]
SPEC_PATH = BACKEND_DIR / "openapi" / "openapi.json"
sys.path.insert(0, str(BACKEND_DIR))
# Importing app.main also builds the app uvicorn serves, from your .env. Mock mode keeps that from needing a
# database (an environment variable beats .env).
os.environ["USE_MOCKS"] = "true"


def current_spec() -> dict[str, Any]:
    """The contract exactly as the code defines it right now, whatever the local settings."""
    from app.config import Settings
    from app.main import create_app

    return create_app(Settings(_env_file=None)).openapi()


def render(spec: dict[str, Any]) -> str:
    return json.dumps(spec, indent=2, ensure_ascii=False) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--write", action="store_true", help="regenerate openapi/openapi.json")
    args = parser.parse_args(argv)

    spec = current_spec()
    if args.write:
        SPEC_PATH.parent.mkdir(exist_ok=True)
        SPEC_PATH.write_text(render(spec), encoding="utf-8", newline="\n")
        print(f"wrote {SPEC_PATH.relative_to(BACKEND_DIR)} ({len(spec['paths'])} paths)")
        return 0
    if not SPEC_PATH.exists() or json.loads(SPEC_PATH.read_text(encoding="utf-8")) != spec:
        print("openapi/openapi.json is out of date. Run: python scripts/check_contract.py --write", file=sys.stderr)
        return 1
    print("openapi/openapi.json matches the code")
    return 0


if __name__ == "__main__":
    sys.exit(main())
