# PRISM backend guide: logic, contract and explanations

Sections 4 to 6 of the "PRISM Backend Guide (Claude Code, Opus 5.5)", 7 October 2026. `backend/CLAUDE.md` points here.

- **Section 4 (the formulas) is authoritative.** Follow it exactly, and ask when something is unclear.
- **Section 5 was the starting point for the contract.** The source of truth is now `backend/openapi/openapi.json`. It adds `GET /me`, `GET`/`PUT /profile`, `GET /domains`, score breakdowns, and the error codes `INTERNAL_ERROR`, `METHOD_NOT_ALLOWED` and `NOT_IMPLEMENTED`.
- **The parent's budget is yearly.** The contract's field is `annual_education_budget`, so capacity = annual budget x duration + savings, which equals the formula below with 12 x monthly budget.

## 4. The logic you must build

This is the part judges care about, so each function below is deterministic, explainable and unit-tested. Weights marked *default* are my starting values; they are not from the problem statement, so tell Eklavya the final ones.

**Step 0: The student's stream decides which careers are open and which come first**

The student picks their Class 11-12 stream: `science_pcm`, `science_pcb`, `science_pcmb`, `commerce_maths`, `commerce`, `arts`, or `undecided` (Class 10 or earlier). Every course lists the streams that may enter it (the regulator's minimum: B.Tech needs Physics and Mathematics under AICTE, MBBS needs Biology under NMC, CA is open to every stream under ICAI) and the streams it naturally follows (B.Com follows Commerce). For a student, a course is

- **natural** when it follows their stream (B.Tech for PCM),
- **open** when they may enter it but it is another stream's route (CA for PCM),
- **closed** when they can't enter it (B.Tech for PCB).

An `undecided` student counts as natural for every course. A career's match is the best over its courses. Closed careers are left out entirely; a career is costed and listed only with the courses of its best match. In the ranking (step 5), natural careers always come before open ones. The rules and sources per programme are in `db/data/programs.csv`.

**Step 1: Normalize answers**

Every question has a dimension and a kind. A `likert` question is a statement answered 1–5. Per dimension, take the mean and scale to 0–1.

```latex
t_k = \frac{\bar{x}_k - 1}{4}
```

A `choice` question has one correct option and is graded: 1 if the student picked it, 0 otherwise. For these dimensions, t_k is the mean of the grades, i.e. the share answered correctly. Each dimension uses only one kind of question, so the two scales are never mixed.

Dimensions: aptitude (logical, numerical, verbal, spatial, creative), interest (six Holland types: realistic, investigative, artistic, social, enterprising, conventional) and cognitive style (analytical vs intuitive, structured vs flexible). Reverse-scored likert questions are flipped before averaging (`6 - x`); choice questions are never reverse-scored. Missing answers are skipped, and a dimension with no answers is flagged `incomplete`.

**Step 2: Student fit per domain**

Each career carries `trait_weights` per group (weights sum to 1 inside each group).

```latex
A_d = \sum_k w^{apt}_{dk}\, t_k, \quad I_d = \sum_k w^{int}_{dk}\, t_k, \quad C_d = \sum_k w^{cog}_{dk}\, t_k
```

```latex
S_d = 0.5\,A_d + 0.3\,I_d + 0.2\,C_d
```

The 0.5 / 0.3 / 0.2 split is a *default*. Domain score is the mean of its careers' scores; career score uses its own weights.

**Step 3: Financial Constraint Solver (per career and college path)**

```latex
\text{total\_cost} = (\text{annual\_fee} + \text{living\_cost}) \times \text{duration\_years} - \text{scholarship\_amount}
```

```latex
\text{capacity} = (12 \times \text{monthly\_budget} + \text{savings} / \text{duration\_years}) \times \text{duration\_years}
```

```latex
\text{loan\_needed} = \max(0,\ \text{total\_cost} - \text{capacity})
```

```latex
\text{net\_salary} = \max(\text{starting\_salary} - 12 \times \text{monthly\_living}, \varepsilon), \quad \text{breakeven} = \text{total\_cost} / \text{net\_salary}
```

Which college path: the **typical** one, not the cheapest. A career's routes run from top government colleges (AIIMS: about Rs 1,628 a year) to private ones (Rs 20+ lakh a year), so the cheapest would make almost every career look free. The typical route is the lower median by total cost among the student's routes in their preferred state, or among all their routes when that state has none (`typical_college` in the response). The response lists up to 4 colleges of each NIRF tier.

A path is **viable** only if `loan_needed <= max_loan` and `breakeven <= breakeven_tolerance_years`. Every failed path returns its reasons (for example `LOAN_EXCEEDS_LIMIT`) and the cheapest viable alternative in the same domain, if one exists. Scholarships reduce cost only if the family matches the eligibility rules.

Financial viability score (0–1), used in ranking:

```latex
F = 0.5\,\min\!\left(1, \frac{\text{capacity}}{\text{total\_cost}}\right) + 0.3\,L + 0.2\,P
```

Here L is 1 when the loan is within the limit, otherwise `max(0, 1 - (loan_needed - max_loan) / total_cost)`, and P is `clamp(1 - breakeven / (2 \times tolerance), 0, 1)`. The 0.5 / 0.3 / 0.2 split is a *default*.

**Step 4: Market score**

For the student's region, min-max scale each signal across all careers, then blend. Fall back to national data and flag it when a region is missing.

```latex
M_d = 0.5\,\text{demand} + 0.3\,\text{growth} + 0.2\,\text{salary\_percentile}
```

**Step 5: Final ranking**

```latex
R_d = \alpha S_d + \beta F_d + \gamma M_d, \quad \alpha + \beta + \gamma = 1
```

Default α = 0.45, β = 0.30, γ = 0.25 (from the PRD). The request can override them (the what-if sliders) but they must sum to 1, otherwise return a 422 error. The order is: the student's own-stream careers that are viable, then own-stream ones that aren't (marked `viable: false` with reasons), then open careers that are viable, then open ones that aren't (step 0); the top 5 are shown, each with `stream_match`. So a PCM student never sees CA above an engineering career. Within each group, higher R first; ties break on higher S, then higher M, then career id, so results never flip between runs.

**Step 6: Parent-Student Conflict Index**

Compute only when both people have finished and consented. Four dimensions, each scored as a gap from 0 (agree) to 1 (fully disagree):

| Dimension | How the gap is computed |
| --- | --- |
| Domain preference | Student's top 3 domains by S, parent's ranked top 3, weights 1.0 / 0.66 / 0.33. Gap = 1 minus the shared weight divided by 1.99 |
| Risk appetite | `abs(student_risk - parent_risk) / 4` |
| Location | 0 if same preferred state and same abroad choice; 0.5 if one differs; 1 if both differ |
| Budget fit | Student's top-ranked path total cost vs family capacity: `min(1, max(0, cost - capacity) / cost)` |

```latex
\text{ConflictIndex} = 100 \times \frac{1}{4}\sum_{j=1}^{4} \text{gap}_j
```

Labels: under 30 low, 30–60 moderate, above 60 high. Return the three largest gaps with plain-language text such as "Parent prefers Medicine; student's best fit is Design".

**Step 7: SWOT**

Strengths: trait dimensions with t ≥ 0.7. Weaknesses: t ≤ 0.4. Opportunities: top careers by M that also have S ≥ 0.5. Threats: non-viable top-fit careers, low-demand regions, high Conflict Index. Every item stores the number that produced it. Minimum two items per quadrant; if the data does not support two, return fewer rather than invent.

**Step 8: Scholarship matching**

A scholarship matches when every rule in its `eligibility` JSON is satisfied by the profile (income limit, category, state, minimum score). Return at least three per career when they exist, with amount, deadline and the rule that matched. If fewer than three exist, return what exists.

**Edge cases the tests must cover:** all answers equal, missing dimension, zero savings, loan limit zero, no viable career, both parents' ranks identical to the student's, weights not summing to 1, region with no market data.

## 5. API contract

Publish this in hour one as `openapi/openapi.json` with a mock for every endpoint. Aayush builds against the mocks; the real code must return exactly the same shapes.

| Method and path | Who calls it | Purpose | Auth |
| --- | --- | --- | --- |
| GET /health | Hosting, you | Liveness and database check | None |
| POST /auth/invite | Student | Create an invite token for the parent | Student |
| POST /auth/link | Parent | Redeem the token; link the two accounts | Parent |
| GET /questions?audience=student or parent | Both | Question set with dimensions and options | Any user |
| POST /responses | Both | Save answers (batch, idempotent per question) | Owner |
| POST /consent | Both | Agree to the comparison | Owner |
| POST /analyze | Either | Run the whole pipeline; returns the roadmap | Linked pair |
| GET /careers/{id}/market | Frontend | Demand and salary by region | Any user |
| POST /explain | Frontend | Explanation for one career (Gemini, cached, template fallback) | Linked pair |
| GET /results/{id} | Frontend | Saved roadmap | Linked pair |
| POST /demo/run | Judges | Load the demo family and return its result id | None, only if `DEMO_ENABLED=true` |

**Conventions**

- JSON with `snake_case` fields; money in rupees as whole numbers; scores 0–1 in the engine and 0–100 in display fields (name them `score_100`).
- Every response carries `data_quality` where data may be estimated, and `as_of` dates for market data.
- IDs are UUID strings. Timestamps are ISO 8601 in UTC.
- Error body is always the same shape:

```json
{"error": {"code": "ASSESSMENT_INCOMPLETE", "message": "Parent assessment is not finished.", "details": {"missing": ["parent"]}}}
```

Codes to implement: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `ASSESSMENT_INCOMPLETE` (409), `CONSENT_REQUIRED` (409), `INVALID_WEIGHTS` (422), `VALIDATION_ERROR` (422), `UPSTREAM_UNAVAILABLE` (503, only for the database).

**Shape of `POST /analyze` (the one that matters)**

Request:

```json
{"student_id": "uuid", "parent_id": "uuid", "weights": {"fit": 0.45, "finance": 0.30, "market": 0.25}}
```

Response (abridged):

```json
{
  "result_id": "uuid",
  "created_at": "2026-10-07T07:00:00Z",
  "weights": {"fit": 0.45, "finance": 0.30, "market": 0.25},
  "conflict": {"index": 42, "label": "moderate",
    "top_gaps": [{"dimension": "domain", "gap": 0.8, "text": "Parent prefers Medicine; student's best fit is Design"}]},
  "swot": {"strengths": [{"text": "Strong logical reasoning", "value": 0.82}], "weaknesses": [], "opportunities": [], "threats": []},
  "roadmap": [{
    "rank": 1, "career_id": "uuid", "career": "Data Scientist", "domain": "Technology",
    "scores": {"fit": 0.78, "finance": 0.66, "market": 0.71, "final": 0.72, "final_100": 72},
    "finance": {"viable": true, "total_cost": 1200000, "capacity": 800000, "loan_needed": 400000,
      "starting_salary": 600000, "breakeven_years": 2.4, "reasons": []},
    "market": {"region": "Tamil Nadu", "demand_index": 0.8, "median_salary": 600000, "as_of": "2026-09-01", "data_quality": "sourced"},
    "path": {"education": "B.Tech CSE then M.Tech", "exams": ["JEE Main"], "colleges": [{"name": "...", "annual_fee": 300000}]},
    "scholarships": [{"name": "...", "amount": 50000, "deadline": "2026-12-31", "matched_rule": "income <= 800000"}],
    "cheaper_alternative": null
  }],
  "rejected": [{"career": "Surgeon", "reasons": ["LOAN_EXCEEDS_LIMIT"], "cheaper_alternative": "Allied health sciences"}]
}
```

**Auth.** The frontend sends the Supabase access token as `Authorization: Bearer <jwt>`. A `current_user` dependency verifies the signature and expiry, maps the subject to a row in `users`, and rejects anything else. For local development only, `DEV_AUTH_BYPASS=true` accepts an `X-Dev-User` header; the app refuses to start with that flag on in production.

**Privacy rules in code (not only in the database)**

- A user can read only their own raw answers.
- The comparison and Conflict Index are returned only after both consents exist.
- Responses never include the other person's raw answers, only the derived gaps.
- Log request ids and status codes, never answers, incomes or tokens.

## 6. Gemini explanations with cache and fallback

`POST /explain` returns an explanation of under 150 words for one career, written from the real scores. It must never block the demo: it tries the cache, then Gemini, then a template, in that order.

**Order of attempts**

1. **Cache hit:** look up `explanations` by a key of result id, career id, weights and model name. Return it immediately with `source: "cache"`.
2. **Gemini call:** timeout 8 seconds, one retry on a transient error, `temperature` low (0.2) so wording stays stable. Save the text with `source: "gemini"`.
3. **Template fallback:** if Gemini errors, times out, is rate-limited, or returns text that fails the checks below, render a Jinja2 template and return `source: "template"`. Do not cache the failure for long; allow a retry after 60 seconds.

**Checks on Gemini output before you accept it**

- Under 150 words, plain text, no markdown headings.
- Every number it mentions must appear in the input data (reject the text otherwise).
- It must not state facts such as colleges or salaries that were not supplied.

**Prompt sent to Gemini (put it in `explain/gemini.py` as a constant)**

```text
You explain career recommendations to a student and their parent in simple, kind language.
Use ONLY the data in the JSON below. Do not add salaries, colleges, exams or statistics that are not in it.
In under 150 words: (1) why this career fits the student, citing the fit score; (2) whether it is affordable, citing cost, loan and break-even years; (3) how much demand there is in the region, citing the demand index and the data date; (4) one honest caution if the path is not viable or the data is estimated.
Write one paragraph for the student and one short paragraph addressed to the parent. No bullet points.
DATA: {json}
```

**Template fallback (same facts, fixed wording)**

```text
{{career}} fits you with a score of {{fit_100}}/100. The estimated family cost is Rs {{total_cost}}, with a loan need of Rs {{loan_needed}} and a payback time of about {{breakeven}} years. Demand in {{region}} is {{demand_label}} (data as of {{as_of}}). {{caution}}
```

**Rules**

- Only the backend calls Gemini; the key is read from `GEMINI_API_KEY` and never logged.
- Free keys have rate limits that I have not checked; confirm the current limits in Google AI Studio before the event and keep the cache so each career is generated once.
- Pre-generate explanations for the demo family right after seeding, so the live demo shows cached text.
- Add a switch `EXPLAIN_MODE=gemini|template` so you can force templates if the API is unstable on the day.
- Return `source` in the response so Aayush can show a small "AI-written" or "template" tag.
