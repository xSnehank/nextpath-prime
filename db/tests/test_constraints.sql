-- The database itself refuses bad rows, so a backend bug or a typo in a seed can't store them.
\ir _helpers.sql
BEGIN;

DO $$
DECLARE
    student  UUID := pg_temp.sign_up('student', 's1@test.local');
    student2 UUID := pg_temp.sign_up('student', 's2@test.local');
    parent   UUID := pg_temp.sign_up('parent', 'p1@test.local');
    parent2  UUID := pg_temp.sign_up('parent', 'p2@test.local');
    engineering CONSTANT UUID := 'd0000000-0000-4000-8000-000000000001';
    medicine    CONSTANT UUID := 'd0000000-0000-4000-8000-000000000004';
    any_course UUID := (SELECT id FROM courses ORDER BY name LIMIT 1);
    any_career UUID := (SELECT id FROM careers ORDER BY name LIMIT 1);
BEGIN
    -- profiles: states spelled like the backend's IndianState; 'India' is a region, not a state
    INSERT INTO profiles (user_id, preferred_state) VALUES (student, 'Tamil Nadu');
    PERFORM pg_temp.expect_error(format('UPDATE profiles SET preferred_state = %L WHERE user_id = %L', 'Tamilnadu', student), '23514');
    PERFORM pg_temp.expect_error(format('UPDATE profiles SET home_state = %L WHERE user_id = %L', 'India', student), '23514');
    PERFORM pg_temp.expect_error(format('UPDATE profiles SET category = %L WHERE user_id = %L', 'OBC', student), '23514');
    PERFORM pg_temp.expect_error(format('UPDATE profiles SET risk_appetite = 6 WHERE user_id = %L', student), '23514');
    -- money is whole, non-negative rupees
    PERFORM pg_temp.expect_error(format('INSERT INTO profiles (user_id, savings) VALUES (%L, -1)', parent), '23514');
    -- consent and its timestamp always go together
    PERFORM pg_temp.expect_error(format('UPDATE profiles SET consent_to_compare = true WHERE user_id = %L', student), '23514');
    -- updated_at is set by the trigger on every update
    UPDATE profiles SET updated_at = '2000-01-01' WHERE user_id = student;
    ASSERT (SELECT updated_at FROM profiles WHERE user_id = student) > '2000-01-01', 'updated_at is refreshed on update';

    -- pairs: students only in the student slot, parents only in the parent slot, one of each
    PERFORM pg_temp.expect_error(format('INSERT INTO pairs (student_id, parent_id) VALUES (%L, %L)', parent, student), '23503');
    INSERT INTO pairs (student_id, parent_id) VALUES (student, parent);
    PERFORM pg_temp.expect_error(format('INSERT INTO pairs (student_id, parent_id) VALUES (%L, %L)', student, parent2), '23505');
    PERFORM pg_temp.expect_error(format('INSERT INTO pairs (student_id, parent_id) VALUES (%L, %L)', student2, parent), '23505');

    -- invites: students only, and only a SHA-256 hash is stored, never the code itself
    PERFORM pg_temp.expect_error(format('INSERT INTO invites (student_id, code_hash, expires_at) VALUES (%L, %L, now())', parent, repeat('a', 64)), '23503');
    PERFORM pg_temp.expect_error(format('INSERT INTO invites (student_id, code_hash, expires_at) VALUES (%L, %L, now())', student, 'PRISM-7KQ2M9XA'), '23514');

    -- parent picks: parents only, ranks 1-3, no domain twice
    PERFORM pg_temp.expect_error(format('INSERT INTO parent_domain_prefs (parent_id, rank, domain_id) VALUES (%L, 1, %L)', student, engineering), '23503');
    PERFORM pg_temp.expect_error(format('INSERT INTO parent_domain_prefs (parent_id, rank, domain_id) VALUES (%L, 4, %L)', parent, engineering), '23514');
    INSERT INTO parent_domain_prefs (parent_id, rank, domain_id) VALUES (parent, 1, engineering);
    PERFORM pg_temp.expect_error(format('INSERT INTO parent_domain_prefs (parent_id, rank, domain_id) VALUES (%L, 2, %L)', parent, engineering), '23505');
    INSERT INTO parent_domain_prefs (parent_id, rank, domain_id) VALUES (parent, 2, medicine);

    -- answers are 1-5
    PERFORM pg_temp.expect_error(format('INSERT INTO responses (user_id, question_id, value) VALUES (%L, %L, 6)', student, 'b0000000-0000-4000-8000-000000000011'), '23514');

    -- questions: one of the 13 dimensions; likert = 5 options, no key; choice = a key, never reverse-scored
    PERFORM pg_temp.expect_error($q$INSERT INTO questions (id, audience, position, kind, dimension, text, options)
        VALUES (gen_random_uuid(), 'student', 900, 'likert', 'logical_aptitude', 'x', '[{},{},{},{},{}]')$q$, '23514');
    PERFORM pg_temp.expect_error($q$INSERT INTO questions (id, audience, position, kind, dimension, text, options)
        VALUES (gen_random_uuid(), 'student', 900, 'likert', 'logical', 'x', '[{},{},{},{}]')$q$, '23514');
    PERFORM pg_temp.expect_error($q$INSERT INTO questions (id, audience, position, kind, dimension, text, options)
        VALUES (gen_random_uuid(), 'student', 900, 'choice', 'logical', 'x', '[{},{},{},{}]')$q$, '23514');
    PERFORM pg_temp.expect_error($q$INSERT INTO questions (id, audience, position, kind, dimension, text, options,
        correct_value, reverse_scored) VALUES (gen_random_uuid(), 'student', 900, 'choice', 'logical', 'x', '[{},{},{},{}]', 2, true)$q$, '23514');

    -- trait weights: exactly the three groups, each with its own dimensions only, each summing to 1
    UPDATE careers SET trait_weights = '{"aptitude": {"logical": 0.6, "numerical": 0.4},
        "interest": {"investigative": 1}, "cognitive": {"analytical": 0.7, "structured": 0.3}}' WHERE id = any_career;
    PERFORM pg_temp.expect_error(format($q$UPDATE careers SET trait_weights = '{"aptitude": {"logical": 0.5, "numerical": 0.4},
        "interest": {"investigative": 1}, "cognitive": {"analytical": 1}}' WHERE id = %L$q$, any_career), '23514');
    PERFORM pg_temp.expect_error(format($q$UPDATE careers SET trait_weights = '{"aptitude": {"logical": 1},
        "interest": {"logical": 1}, "cognitive": {"analytical": 1}}' WHERE id = %L$q$, any_career), '23514');
    PERFORM pg_temp.expect_error(format($q$UPDATE careers SET trait_weights = '{"aptitude": {"logical": 1},
        "interest": {"social": 1}}' WHERE id = %L$q$, any_career), '23514');
    PERFORM pg_temp.expect_error(format($q$UPDATE careers SET trait_weights = '{"aptitude": {"logical": 1.1, "numerical": -0.1},
        "interest": {"social": 1}, "cognitive": {"analytical": 1}}' WHERE id = %L$q$, any_career), '23514');

    -- every real-world figure has a source URL and date, or is marked estimated
    PERFORM pg_temp.expect_error(format($q$INSERT INTO exams_colleges (course_id, exam, college, annual_fee, source)
        VALUES (%L, 'X', 'Y', 1000, 'somewhere')$q$, any_course), '23514');
    PERFORM pg_temp.expect_error(format($q$INSERT INTO market_data (career_id, region, source, as_of, estimated)
        VALUES (%L, 'Bengaluru', 'x', '2026-01-01', true)$q$, any_career), '23514');

    -- scholarships: lower-case categories, real states (not 'India'), a known amount period
    PERFORM pg_temp.expect_error($q$INSERT INTO scholarships (name, provider, amount, amount_period, eligibility_text,
        source, estimated, categories) VALUES ('t', 'p', 1, 'per_year', 'x', 'x', true, '{OBC}')$q$, '23514');
    PERFORM pg_temp.expect_error($q$INSERT INTO scholarships (name, provider, amount, amount_period, eligibility_text,
        source, estimated, states) VALUES ('t', 'p', 1, 'per_year', 'x', 'x', true, '{Tamilnadu}')$q$, '23514');
    PERFORM pg_temp.expect_error($q$INSERT INTO scholarships (name, provider, amount, amount_period, eligibility_text,
        source, estimated, states) VALUES ('t', 'p', 1, 'per_year', 'x', 'x', true, '{India}')$q$, '23514');
    PERFORM pg_temp.expect_error($q$INSERT INTO scholarships (name, provider, amount, amount_period, eligibility_text,
        source, estimated) VALUES ('t', 'p', 1, 'monthly', 'x', 'x', true)$q$, '23514');
END $$;

ROLLBACK;
