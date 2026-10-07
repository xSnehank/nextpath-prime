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
