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
