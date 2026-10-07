# PRISM Engine API (backend)

FastAPI service that turns a student's answers, the parent's finances and market data into a ranked,
affordable career roadmap. The contract is [openapi/openapi.json](openapi/openapi.json); while the
server runs, browse and try it at http://localhost:8000/docs.

## Run it (from `backend/`)

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -e ".[dev]"
cp .env.example .env
.venv/Scripts/python -m uvicorn app.main:app --reload
```

On macOS or Linux, use `.venv/bin/python` instead of `.venv/Scripts/python`.

## Mock mode

With `USE_MOCKS=true` (the default) every endpoint answers from `app/mocks/*.json`: a fictional family
(Aarav and Rajesh Sharma) whose numbers follow the formulas in `docs/backend-guide.md`. No database or
token is needed, and nothing is stored. You act as the student by default; to act as the parent, send
`X-Dev-User: 22222222-2222-4222-8222-222222222222`.

## Live mode (the real database and sign-in)

Set these in `backend/.env` (never commit it):

| Variable | Where to find it |
| --- | --- |
| `USE_MOCKS=false` | |
| `DATABASE_URL` | Supabase dashboard -> Connect -> Session pooler. It contains the database password. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase dashboard -> Project Settings -> API (both are public). |

The app refuses to start in live mode without all three. It checks each `Authorization: Bearer <token>`
with Supabase (`/auth/v1/user`), so it holds no signing secret. For local testing without signing in,
`DEV_AUTH_BYPASS=true` accepts `X-Dev-User: <users.id>` instead; it's refused when `ENVIRONMENT=production`.

Without sign-in, these work: `GET /health`, `GET /careers/{id}/market`, and, while `DEMO_ENABLED=true`,
`POST /demo/run` plus the demo family's result and explanations (the frontend's Live Demo).

`GET /health` reports `"database": "ok"` or `"unavailable"`. A database outage on any other endpoint is a
503 `UPSTREAM_UNAVAILABLE`.

## Test

```bash
.venv/Scripts/python -m pytest -q --cov=app   # live-mode tests build a throwaway PostgreSQL from db/
.venv/Scripts/python scripts/check_contract.py           # is openapi.json up to date?
.venv/Scripts/python scripts/check_contract.py --write   # regenerate it after changing app/schemas/
```

## Errors

Every error is `{"error": {"code", "message", "details"}}`, and every response carries an `X-Request-ID`
header to quote in bug reports. Codes: `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404,
`METHOD_NOT_ALLOWED` 405, `ASSESSMENT_INCOMPLETE` 409, `CONSENT_REQUIRED` 409, `INVALID_WEIGHTS` 422,
`VALIDATION_ERROR` 422, `INTERNAL_ERROR` 500, `UPSTREAM_UNAVAILABLE` 503 (the database or Supabase sign-in).

## Layout

| Folder | What lives there |
| --- | --- |
| `app/api/` | Thin routers: who is calling, validate, call a service or mock, return a schema |
| `app/schemas/` | Pydantic models; these are the contract |
| `app/core/` | Pure scoring functions (backend guide, section 4), unit-tested by hand |
| `app/services/` | Orchestration: load data, run core, save results |
| `app/repositories/` | All SQL |
| `app/mocks/` | Mock responses, validated against the schemas |
| `tests/`, `scripts/` | pytest suites; contract export and check |
