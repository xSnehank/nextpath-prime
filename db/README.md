# Database

PostgreSQL schema and seed data for PRISM Engine. It's hosted on Supabase and tested on a throwaway local PostgreSQL.

| Path | What it is |
| --- | --- |
| `migrations/` | The schema, applied in number order. **The source of truth.** Never edit one that has run on Supabase; add the next number. |
| `schema.sql` | A generated, readable snapshot of the schema. Don't edit it; regenerate it (see below). |
| `seed/` | Seed data. `00_run_all.sql` runs the files in order, and every file can be re-run safely. |
| `tests/` | `supabase_shim.sql` (a local stand-in for Supabase's `auth` schema and roles) and the `test_*.sql` checks. |
| `scripts/check_db.py` | Builds everything on a throwaway PostgreSQL and runs the tests. |

## Test (no database or password needed)
From the repo root, with any Python 3.12+ (the backend's `.venv` works):
```
python db/scripts/check_db.py           # migrations, seeds (twice), tests; fails if schema.sql is stale
python db/scripts/check_db.py --write   # the same, then regenerates schema.sql
```
It needs the PostgreSQL 15+ command-line tools. It finds them in `PG_BIN`, on `PATH`, or in
`C:\Program Files\PostgreSQL\<version>\bin`. It starts its own server in a temp folder on a free port, and
deletes it at the end, so your own databases are never touched.

## Set up Supabase (hosted)
1. **SQL editor → New query:** paste `migrations/001_init.sql` and run it. It runs as one transaction, so it all
   applies or nothing does.
2. **Seed:** run `seed/01_questions.sql`, then `seed/02_careers_courses.sql`. The editor can't run
   `00_run_all.sql`, because `\ir` only works in psql.
3. **Authentication → Providers → Email:** sign-up stays on. Every new account gets a `users` row from the
   `handle_new_user()` trigger, using the `role` and `full_name` the frontend sends in
   `supabase.auth.signUp({ options: { data: { role, full_name } } })`.
4. **Connect → Session pooler:** that connection string is the backend's `DATABASE_URL` (in `backend/.env`,
   never in git).

Row-level security is on for every table, with no policies, and the browser roles (`anon`, `authenticated`) have
no grants. The public anon key therefore can't read or change anything through Supabase's REST API. Only the
backend can, because it connects as the table owner.

## Local PostgreSQL (optional)
```
createdb prism
psql -v ON_ERROR_STOP=1 -1 -d prism -f db/tests/supabase_shim.sql
psql -v ON_ERROR_STOP=1 -1 -d prism -f db/migrations/001_init.sql
psql -v ON_ERROR_STOP=1 -1 -d prism -f db/seed/00_run_all.sql
```
Reset with `dropdb prism`, then run the same four commands.

## Data rules
- Every real-world figure (fee, salary, demand, scholarship) has a `source`, a `source_url` and an `as_of` date,
  or `estimated = true`. The database refuses a "sourced" row without a URL and date.
- Money is whole rupees. State names are spelled exactly like the backend's `IndianState`.
- `check_db.py` prints known gaps, such as careers with fewer than 3 undergraduate routes.
