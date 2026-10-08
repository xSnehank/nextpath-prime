-- =============================================================================
-- Seed 06: the demo family behind "Live Demo" (POST /demo/run, public while DEMO_ENABLED=true).
--
-- A fictional student and parent, with the same ids as the backend's mock family, so the frontend works the
-- same way in mock and live mode. They have no password, so nobody can sign in as them. On Supabase their
-- auth.users rows are inserted directly (the handle_new_user trigger creates the users rows, as for anyone).
-- =============================================================================

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('11111111-1111-4111-8111-111111111111', 'aarav.demo@example.com',
     '{"role": "student", "full_name": "Aarav Sharma (demo)"}'),
    ('22222222-2222-4222-8222-222222222222', 'rajesh.demo@example.com',
     '{"role": "parent", "full_name": "Rajesh Sharma (demo)"}')
ON CONFLICT (id) DO NOTHING;

-- The student: studies PCMB (so both engineering and medicine are open), wants Karnataka and is open to
-- studying abroad; lives in Maharashtra.
INSERT INTO profiles (user_id, risk_appetite, preferred_state, open_to_abroad, home_state, category, percentage,
                      gender, stream, consent_to_compare, consent_at)
VALUES ('11111111-1111-4111-8111-111111111111', 4, 'Karnataka', true, 'Maharashtra', 'general', 88.0, 'male',
        'science_pcmb', true, now())
ON CONFLICT (user_id) DO UPDATE SET
    risk_appetite = EXCLUDED.risk_appetite, preferred_state = EXCLUDED.preferred_state,
    open_to_abroad = EXCLUDED.open_to_abroad, home_state = EXCLUDED.home_state, category = EXCLUDED.category,
    percentage = EXCLUDED.percentage, gender = EXCLUDED.gender, stream = EXCLUDED.stream, consent_to_compare = true,
    consent_at = coalesce(profiles.consent_at, now());

-- The parent: Rs 2.5 lakh a year for education, Rs 6 lakh saved, loans up to Rs 8 lakh, cautious about risk,
-- prefers Maharashtra and India only, and hopes for Medicine, then Engineering, then Sciences.
INSERT INTO profiles (user_id, annual_education_budget, savings, max_loan, annual_income, risk_appetite,
                      breakeven_tolerance_years, preferred_state, open_to_abroad, consent_to_compare, consent_at)
VALUES ('22222222-2222-4222-8222-222222222222', 250000, 600000, 800000, 1200000, 2, 5, 'Maharashtra', false,
        true, now())
ON CONFLICT (user_id) DO UPDATE SET
    annual_education_budget = EXCLUDED.annual_education_budget, savings = EXCLUDED.savings,
    max_loan = EXCLUDED.max_loan, annual_income = EXCLUDED.annual_income, risk_appetite = EXCLUDED.risk_appetite,
    breakeven_tolerance_years = EXCLUDED.breakeven_tolerance_years, preferred_state = EXCLUDED.preferred_state,
    open_to_abroad = EXCLUDED.open_to_abroad, consent_to_compare = true, consent_at = coalesce(profiles.consent_at, now());

INSERT INTO parent_domain_prefs (parent_id, rank, domain_id) VALUES
    ('22222222-2222-4222-8222-222222222222', 1, 'd0000000-0000-4000-8000-000000000004'),
    ('22222222-2222-4222-8222-222222222222', 2, 'd0000000-0000-4000-8000-000000000001'),
    ('22222222-2222-4222-8222-222222222222', 3, 'd0000000-0000-4000-8000-000000000002')
ON CONFLICT (parent_id, rank) DO UPDATE SET domain_id = EXCLUDED.domain_id;

INSERT INTO pairs (student_id, parent_id) VALUES
    ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')
ON CONFLICT DO NOTHING;

-- All 33 answers: strong at logic and numbers (8 of the 10 graded questions right), most interested in
-- investigating how things work, analytical and fairly structured.
INSERT INTO responses (user_id, question_id, value)
SELECT '11111111-1111-4111-8111-111111111111', CAST('b0000000-0000-4000-8000-0000000000' || lpad(v.n::text, 2, '0') AS uuid), v.value
FROM (VALUES
    (1, 2), (2, 4), (3, 1), (4, 2), (5, 1), (6, 4), (7, 3), (8, 1), (9, 2), (10, 1),  -- graded: 8 and 10 wrong
    (11, 3), (12, 3),                                    -- creative
    (13, 4), (14, 3), (15, 5), (16, 5), (17, 3),         -- realistic, investigative
    (18, 3), (19, 2), (20, 3), (21, 2),                  -- artistic, social
    (22, 3), (23, 2), (24, 3), (25, 4),                  -- enterprising, conventional
    (26, 5), (27, 4), (28, 4), (29, 4),                  -- analytical
    (30, 4), (31, 3), (32, 4), (33, 2)                   -- structured (33 is reverse-scored)
) AS v(n, value)
ON CONFLICT (user_id, question_id) DO UPDATE SET value = EXCLUDED.value;
