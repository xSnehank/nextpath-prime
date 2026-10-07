# PRISM Engine backend (FastAPI, Python 3.14; requires >=3.12)

Career-guidance API for DataQuest 3.0 (problem DQNM): student answers + parent finances + market data ->
ranked, affordable career roadmap. Team: Snehank (backend and db/, repo lead), Aayush (frontend/),
Eklavya (docs/ and the PPT; needs real measured numbers). Joel left on 2026-10-07; his db/ work is now Snehank's.

## Working with Snehank
- He is new to FastAPI, Pydantic, SQLAlchemy and pytest: explain what you will do and why before doing it.
- Plan mode first for every branch; wait for approval before writing code.
- Ask instead of inventing data, columns, formulas, salaries or sources.
- End every task with: what was built, which tests pass, assumptions made, what to check by hand.
- Keep answers short between steps; don't repeat file contents back.
- Edit only backend/ and db/ (plus docs/, PROMPTS.md, BRANCHES.md and the root CLAUDE.md when asked).
  Never edit frontend/. Database rules: db/CLAUDE.md.

## Rules
- Scoring logic lives in app/core/ as PURE functions: no database, no network, no randomness.
- Routers in app/api/ are thin. SQL lives only in app/repositories/. Use only tables and columns in
  db/schema.sql (generated from db/migrations/); schema changes go in a new migration (db/CLAUDE.md).
- The contract is openapi/openapi.json, generated from app/schemas/. Never rename or remove a field without
  telling Snehank (Aayush builds against it). After any schema change: python scripts/check_contract.py --write
- Mocks in app/mocks/*.json are validated against the same models; tests enforce it.
- JSON is snake_case. Money is whole rupees (int). Scores are floats 0..1; display ints are named *_100.
- Errors: raise AppError (app/errors.py); every error is {"error": {"code", "message", "details"}}.
  Never echo submitted values in errors.
- Privacy: never return the other person's raw answers or the parent's raw budget, savings or loan limit; the
  comparison only after both consents. Never log answers, incomes, tokens or keys.
- Only the backend calls Gemini (app/services/explain/), key from GEMINI_API_KEY; always fall back to the
  Jinja2 template; never put LLM output in the ranking path.
- Default weights: fit 0.45, finance 0.30, market 0.25 (must sum to 1, else INVALID_WEIGHTS 422).
- Formulas: docs/backend-guide.md section 4. Follow them exactly; if something is unclear, ask.
- Every function in app/core/ needs unit tests with hand-computed values (show the arithmetic), including edge cases.

## Commands (from backend/)
- Install: python -m venv .venv, then .venv/Scripts/python -m pip install -e ".[dev]"
- Run: .venv/Scripts/python -m uvicorn app.main:app --reload   (docs at http://localhost:8000/docs)
- Test: .venv/Scripts/python -m pytest -q --cov=app
- Contract: .venv/Scripts/python scripts/check_contract.py [--write]

## Git
- Branch from develop (branch names in BRANCHES.md); PR into develop; one reviewer from another layer.
- Add the best prompt for each branch to PROMPTS.md, under "## Backend" (or "## Database" for db/ branches).
