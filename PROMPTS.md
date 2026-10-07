# Prompt log
Best prompts used with AI tools, and what they produced (proof of AI-led build).

## Backend (Snehank, Claude Code with Opus 5.5)

### chore/be-openapi-contract
**Prompt** (plan mode, highest effort): the backend master prompt (role, team boundaries, stack, contract
shapes, the section-4 formulas, privacy rules), ending with: "Read the repo and tell me what exists and what
is missing. List the schema fields db/schema.sql does not have, written as a message I can send to Joel.
Give me the plan for chore/be-openapi-contract. Wait for my approval."

**What it produced:**
- An audit showing that Aayush's frontend types and Joel's schema both disagreed with the guide's contract.
- Three decisions: guide shapes plus a frontend adapter, a typed `PUT /profile`, and Python 3.14.
- Emails to Joel (13 schema asks) and Aayush (the contract differences).
- The FastAPI skeleton: 15 mocked endpoints, one error format, `backend/openapi/openapi.json`, and 62 tests.
  The tests check that every route matches its contract and that the mock numbers obey the formulas.

## Database (Snehank, Claude Code with Opus 5.5)

### fix/db-schema-review
**Prompt** (plan mode): "Joel is no longer working on this and we have to do the rest. Start working on it."
Decisions taken in planning:
- close Joel's revert PRs and fix forward
- keep the graded aptitude questions
- use the app's 8 domains
- Snehank creates his own Supabase project

**What it produced:**
- One clean `001_init.sql` covering all 23 review comments on #1, #5 and #6: Supabase auth link, invites and
  pairs, typed profiles, graded questions, courses with levels, sourced-or-estimated figures, regions, results
  and the explanation cache. RLS is on for every table and the browser roles have no access.
- Seeds: 33 questions on the 13 dimensions, with answer keys spread over A–D. 13 careers in the app's 8
  domains, including Armed Forces Officer (NDA) sourced from UPSC's notice. Joel's unchecked fees are kept
  but marked estimated.
- `db/scripts/check_db.py`: builds everything on a throwaway PostgreSQL, runs the seeds twice, and runs the SQL
  tests for sign-up, constraints, RLS and seed facts. On its first run it caught a CHECK that let a graded
  question through with no answer key.
- `backend/tests/test_db_consistency.py`: the database's states, roles, categories, genders, trait keys and
  domains match the backend's.
