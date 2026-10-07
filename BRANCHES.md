# Branching plan — PRISM Engine

main      = demo-ready, deployed. Only merged from `develop` at checkpoints.
develop   = integration branch. All feature branches PR into it (merge at least every ~2 hours).

Naming: <type>/<layer>-<story-id>-<short-name>
Layers: fe = Member 1 (Frontend), be = Member 2 (Backend), db = Member 3 (Database + deploy)

## Phase 1 — Contract (first 10%)
- chore/be-openapi-contract       Member 2: OpenAPI spec + mock responses
- chore/db-schema-and-seed        Member 3: schema, migrations, seed script
- chore/fe-wireframes-scaffold    Member 1: Next.js scaffold, Tailwind, shadcn/ui, wireframes

## Member 1 — Frontend
- feat/fe-A1-signup-onboarding       A1  (P0)
- feat/fe-A2-parent-invite-link      A2  (P0)
- feat/fe-B1-student-assessment      B1  (P0)
- feat/fe-B2-B3-parent-assessment    B2, B3 (P0)
- feat/fe-C2-conflict-gauge          C2  (P0)
- feat/fe-D1-finance-view            D1  (P0)
- feat/fe-D2-market-demand-view      D2  (P0)
- feat/fe-E1-roadmap-page            E1, E2 (P0)
- feat/fe-F1-F2-demo-family-mobile   F1, F2 (P0)
- feat/fe-C3-swot-dashboard          C3  (P1)
- feat/fe-D3-what-if-sliders         D3  (P1)
- feat/fe-E4-pdf-export              E4  (P1)

## Member 2 — Backend
- feat/be-A1-A2-auth-linking         A1, A2 (P0)
- feat/be-B-responses-api            B1-B3 endpoints (P0)
- feat/be-C1-scoring-engine          C1  (P0)  + unit tests
- feat/be-C2-conflict-index          C2  (P0)  + unit tests
- feat/be-D1-financial-solver        D1  (P0)  + unit tests
- feat/be-D2-market-blend            D2, ranking R_d (P0)
- feat/be-E1-E2-roadmap-endpoint     POST /analyze, E1, E2 (P0)
- feat/be-C3-swot-logic              C3  (P1)
- feat/be-E3-template-explanations   E3, F9 (P1) — Jinja2 templates, optional Ollama
- feat/be-E5-alternate-paths         E5  (P2)

## Member 3 — Database + data + deploy
- feat/db-questions-bank             B1-B3 question bank (P0)
- feat/db-careers-courses            careers, exams_colleges (P0)
- feat/db-market-data-seed           D2 market_data, 10-15 careers (P0)
- feat/db-scholarships               E2 scholarships (P0)
- feat/db-rls-policies               row-level security, consent (P0)
- chore/db-deploy-pipeline           Vercel + Render/Railway + Supabase env (P0)
- feat/db-demo-family-seed           F1 sample student + parent (P0)
- feat/db-E5-local-steam-ideas       E5 regional idea data (P2)

## Rules
1. Branch from `develop`, PR back into `develop`; one reviewer from another layer.
2. API contract changes only after a team-chat message.
3. AI-written scoring/cost functions need a unit test before merge.
4. Add best prompts to PROMPTS.md.
