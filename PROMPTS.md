# Prompt Log (PROMPTS.md)
Best prompts used with AI tools, and what they produced (proof of AI-led build).

---

## Frontend (Aayush, Antigravity)

**Team Member**: Aayush (Frontend Lead)  
**Problem Statement**: PRISM Engine / NextPath (DataQuest 3.0, problem DQNM)  
**Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, React Hook Form, Zod, jsPDF, Lucide React

---

### Prompt 1: Project Scaffold & Design System
> "Initialize Next.js App Router with TypeScript and Tailwind CSS. Implement a dark-first luxury prismatic theme with cyan, violet, and indigo gradients, glassmorphism card surfaces, and accessible semantic colors for student aptitude, parental constraints, and conflict gauge levels."

### Prompt 2: API Contract & Mock Data Layer
> "Define full TypeScript interfaces for OpenAPI contract: DomainScore, ConflictResult, FinancePath, MarketData, CareerPath, SwotAnalysis, and AnalyzeResponse. Create a zero-latency fallback mock layer with 30 student psychometric questions, 10 parent questions, and a pre-configured sample demo family with realistic Indian education costs and career trajectories."

### Prompt 3: UI Primitives & Glassmorphic Component Library
> "Create accessible, modular shadcn/ui-inspired primitives (Button, Card, Input, Slider, Progress, Badge, Tabs) styled with Tailwind CSS, custom glass effects, and micro-animations."

### Prompt 4: Student Assessment Flow (Epic B1)
> "Create a 30-question student assessment page with 1-question-per-screen layout, animated progress bar, category indicators (aptitude, interest, thinking style), auto-save to localStorage for pause/resume, and keyboard navigation."

### Prompt 5: Parent Assessment & Constraint Vectorization (Epic B2, B3)
> "Build a parent assessment form validating INR budget, savings, 5-point loan tolerance, 5-point risk appetite, and an interactive top-3 domain ranking selector with real-time feedback."

### Prompt 6: Conflict Index Gauge & SWOT Matrix (Epic C2, C3)
> "Implement a custom SVG semicircle gauge visualizing the Parent-Student Conflict Index (0-100) with low/moderate/high semantic badges and a breakdown of the top 3 friction points. Build an interactive 4-quadrant SWOT analytics matrix mapped to psychometric scores."

### Prompt 7: Financial Solver & Regional Labor Market Intelligence (Epic D1, D2)
> "Build the Financial Constraint Solver card showing 4-year cost, family share, loan requirements, break-even years, and flagged unviable paths with cheaper STEAM alternatives. Pair with an interactive Indian regional hiring demand and median salary visualizer with verified sources."

### Prompt 8: Ranked Career Roadmap & Scholarships (Epic E1, E2, E3, E4)
> "Create the multi-path career roadmap displaying top 5 recommendations with composite match scores, entrance examinations (JEE/NEET/NID/CUET), NIRF top institutions, targeted scholarships with deadlines, AI plain-language reasoning, and one-click PDF export."

### Prompt 9: NextPath Editorial Revamp (Anti-AI-Slop Reachwise Style)
> "Revamp the landing page and navigation to follow Reachwise editorial design with Obsidian black (#08090a), electric volt (#d4ff3a) accents, Funnel Display and Geist Mono typography, interactive persona sandbox simulator, crisis metrics, and deterministic tri-vector architecture."

### Prompt 10: Contract Adherence, Real Supabase Auth & Wireframes Hardening
> "Make every change listed in PR #4 change request: real Supabase auth for student signup and parent join, dual explicit consent step, strict API loading order on dashboard without silent demo fallback, user-specific survey answer caching with 1-5 validation, whole rupee validation on parent finances, weights normalization to exact 1.0, AI explanation fallback retry, and removal of hardcoded mock IDs, fake names ('Aarav Sharma' / 'Rajesh Sharma'), and stale localStorage keys."

**What it produced:**
- Connected frontend authentication to Supabase Auth (`signUp`, `signInWithPassword`) with fallback mock roles (`sessionStorage`) when mock mode is enabled.
- Replaced automatic consent with a dedicated two-sentence `ConsentStep` component requiring explicit checkbox confirmation and supporting consent withdrawal.
- Cleaned up API adapter: Bearer token injection, conditional `X-Dev-User` header only in mock mode, exact weights normalization (`round4`), and real duration calculation for `COST_EXCEEDS_CAPACITY`.
- Implemented robust dashboard data resolution: `?result_id=` lookup, `GET /me` error surfacing, missing prerequisites checklist screen, demo badge toggle, and deterministic AI explanation retry fallback.
- Sanitized user data: removed fictional placeholder names ("Aarav Sharma", "Rajesh Sharma"), removed hardcoded domicile, and validated whole rupees on parent financial calibration.

### Prompt 11: PR #4 Review Polish & Flow Hardening
> "Resolve 11 reviewer comments on PR #4: support onboarding for email confirmation accounts, inline parent invite generation and explicit consent directly on dashboard prerequisites screen without restarting assessments, non-blocking consent decline ('Not now'), unified role-based sign-in page (/signin) with offline mock mode shortcuts, truth-in-advertising privacy footer, unselected defaults for student preference fields, stay-on-page retry for invite generation, single getSession read in API adapter, and dynamic question counts."

**What it produced:**
- Created dedicated `/onboarding` page and session storage fallback ensuring student preferences are never lost when Supabase email confirmation is enabled.
- Built `InviteParentCard` and rendered both parent invite and `ConsentStep` inline on the dashboard prerequisites screen, eliminating assessment restarts and redirect loops.
- Added non-blocking consent option (`onSkip`) with explicit messaging that cross-generational comparison stays hidden until dual agreement is reached.
- Created unified `/signin` page routing users by role and completion progress, with local mock mode shortcuts for demo student and demo parent.
- Replaced "zero-knowledge bridge" claim with truthful explanation that raw answers remain on server and only comparisons are shared.
- Standardized preference form defaults to start empty/unselected, enforcing explicit choices before proceeding.
- Eliminated redundant `getUser()` calls by reading Supabase session once in `getHeaders()`.
- Dynamically rendered assessment question counts using `questions.length` and `me.progress.questions_required`.

### feat/fe-simplify-theme (Snehank, Claude Code with Opus 5.5)
**Prompt** (plan mode): "1. Remove Live Demo 2. Everything looks very crowded and stuffed with a lot of options.
Reduce the texts and buttons ... Make everything very simplistic without changing any functionality. 3. Add
information about what the User is filling. When hovered over the text, a floating box appears below the cursor
explaining what the question is (Parent and Student choice filling not Psychometric test). 4. Add Light/Dark Theme
option with Light as Default."

**What it produced:**
- Theme tokens in `globals.css` (light by default, `.dark` on request, saved in `localStorage.theme`, applied
  before first paint); UI primitives and charts use the tokens instead of hard-coded colours.
- Live Demo removed (frontend, `api.runDemo`, `DEMO_ENABLED=false` in `.env.example`).
- Every page simplified: landing 917 to about 90 lines, sign-up is account-only (preferences on onboarding), shared
  `ChoiceFields`/`PageShell`, optional fields collapsed, dashboard tabs Careers / Comparison / Cost / Jobs /
  Strengths with the sliders behind "Adjust priorities"; new Sign out; the broken "Retake Assessment" removed.
- `FieldHint`: hover box below the cursor (portal, kept on screen, flips above near the bottom), also on keyboard
  focus and tap, on every student and parent choice; texts in `lib/constants.ts` follow what the backend does.

---

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

### chore/be-contract-updates
**Prompt:** "Add partner.full_name to GET /me and fix the root .env.example. It uses SUPABASE_URL and
SUPABASE_ANON_KEY, but the browser can only read variables starting with NEXT_PUBLIC_." Then, in plan mode
after Joel left: "Joel is no longer working on this, and we have to do the rest."

**What it produced:**
- `partner.full_name` in `GET /me`, and a root `.env.example` that says which file each variable goes in.
- Graded multiple-choice questions: `Question.kind` is `likert` or `choice`, the answer key stays on the
  server, and the guide documents the grading. The mock's aptitude items have correct answers spread
  over A–D, because Joel's answer key only ever used A, B or C.

### feat/be-A1-A2-auth-linking (live mode, scoring engine, real data)
**Prompt:** "Merge PR #15 and start the sign-in branch. Merge Aayush's PR and then correct all errors and
mistakes. Review frontend, backend and database and fix everything. Then connect frontend, backend and
database and check that everything works."

**What it produced:**
- Live mode for every endpoint: Supabase token checks, invites and linking, profiles, answers, consent,
  `/analyze`, results, explanations (template, or Gemini with number checks), market data and the demo run.
- The scoring engine as pure functions (`app/core`) with 31 hand-computed unit tests, and 24 live-mode tests
  against a throwaway PostgreSQL built from `db/`.
- Real data: trait weights from O*NET 31.0, salaries from PayScale India, demand from ManpowerGroup's
  Q4 2026 survey, growth from Naukri JobSpeak, living cost from MoSPI, three checkable scholarships.

### docs/release-readme-deck (release)
**Prompt** (plan mode): "Push everything, every change to GitHub along with Vercel deployment. Ensure your
repository contains: 1. A clear and informative README file 2. A PowerPoint presentation summarizing the project
3. The GitHub repo does not show Claude as contributor."

**What it produced:**
- Root `README.md`, the judges' entry point: live links, the 3-step flow, the ranking formula table, privacy,
  data sources with honest caveats, a Mermaid architecture diagram, local setup, deployment, tests and the team.
- `docs/PRISM-Engine.pptx`: 14 slides with speaker notes. Every number was read from the live database, the
  OpenAPI contract or the test run (33 questions, 13 traits, 13 careers, 28 routes, 29 exams, 135 tests). It was
  rendered with PowerPoint and checked slide by slide.
- `backend/vercel.json`: the API's Vercel Functions run in `bom1` (Mumbai), next to the Supabase database.
- Contributor check: no commit on any GitHub branch carries a Claude co-author line, so `main` gets `develop`
  with an ordinary merge and no history rewrite.

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

### feat/stream-aware-catalog (database, backend and frontend)
**Prompt** (plan mode): "Increase the number of professions, career paths, colleges and exams, extending to Tier 3
colleges as well. Add at least 200 colleges and 20 different streams from Science, Commerce and Arts. Stay accurate.
A Science PCM student should not have Commerce or Arts options like Chartered Accountant or Business Management on
top. Everything should be properly curated, with more professions and streams such as Cybersecurity, Data Scientist,
AI/ML, EnTC, ECE, ECM, Mathematics and Computing, Mechanical, Robotics, Instrumentation, Astronomy and Physics."
Decisions taken in planning:
- own-stream careers first
- the cost is based on a typical college
- official fees where available, else flagged as estimated
- a "Not decided yet" stream

**What it produced:**
- `db/data/*.csv`, a curated catalog:
  - 56 careers and 59 degree programmes, each with the regulator's eligible streams and its natural streams
  - 355 colleges with NIRF 2025 ranks and tiers, and 2,811 routes
  - fee sources: 68 official documents, 90 portal figures marked estimated, and the rest as flagged group medians
- `db/scripts/build_catalog.py` validates the CSVs and generates seed 02.
- O*NET trait weights for every career are now read from `careers.csv`, and PayScale market rows were added for the
  43 new careers.
- Migration 004 adds `profiles.stream`, `courses.eligible_streams` / `primary_streams` and `exams_colleges.tier`.
- Backend:
  - `app/core/streams.py` (step 0) and `finance.typical_option` (median college, preferring the student's state)
  - a stream-aware ranking (own stream first)
  - `StudentProfile.stream`, plus `stream_match`, `typical_college` and the college tier, course and city in results
- Frontend: a stream question on onboarding, "Outside your stream" badges, and colleges grouped by tier.
- Tests: 161 backend tests, including live checks that every stream's top 5 is its own and that a PCB student never
  sees a career they can't enter; SQL tests for streams and tiers.
