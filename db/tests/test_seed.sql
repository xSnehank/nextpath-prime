-- The seed data is complete and consistent. Known gaps are printed as notices, not failures.
\ir _helpers.sql
BEGIN;

DO $$
BEGIN
    -- question bank
    ASSERT (SELECT count(*) FROM questions WHERE audience = 'student') = 33, 'the student bank has 33 questions';
    ASSERT NOT EXISTS (SELECT 1 FROM questions WHERE audience = 'parent'), 'parents get no questions';
    ASSERT (SELECT array_agg(position::int ORDER BY position) FROM questions WHERE audience = 'student')
           = (SELECT array_agg(g) FROM generate_series(1, 33) AS g), 'positions run 1-33 with no gaps';
    ASSERT (SELECT count(DISTINCT dimension) FROM questions) = 13, 'all 13 dimensions have questions';
    ASSERT NOT EXISTS (SELECT dimension FROM questions GROUP BY dimension
                       HAVING count(*) < 2 OR count(DISTINCT kind) > 1),
           'every dimension has at least 2 questions, all of one kind';
    ASSERT NOT EXISTS (
        SELECT 1 FROM questions q
        WHERE (SELECT array_agg((o ->> 'value')::int ORDER BY i)
               FROM jsonb_array_elements(q.options) WITH ORDINALITY AS e(o, i))
           <> (SELECT array_agg(g) FROM generate_series(1, jsonb_array_length(q.options)) AS g)
           OR EXISTS (SELECT 1 FROM jsonb_array_elements(q.options) AS o WHERE coalesce(o ->> 'label', '') = '')
    ), 'options are numbered from 1 in order, and every option has a label';
    ASSERT (SELECT count(DISTINCT correct_value) FROM questions WHERE kind = 'choice') = 4,
           'the graded answers use all of A-D';

    -- domains and careers
    ASSERT (SELECT count(*) FROM domains) = 8, 'the app has 8 domains';
    ASSERT NOT EXISTS (SELECT 1 FROM domains d WHERE NOT EXISTS (SELECT 1 FROM careers c WHERE c.domain_id = d.id)),
           'every domain has a career';
    ASSERT (SELECT count(*) FROM careers) = 13, '13 careers';
    ASSERT NOT EXISTS (SELECT 1 FROM careers c
                       WHERE NOT EXISTS (SELECT 1 FROM courses co WHERE co.career_id = c.id AND co.level = 'UG')),
           'every career has an undergraduate course';
    ASSERT NOT EXISTS (SELECT 1 FROM careers WHERE trait_weights IS NULL), 'every career has O*NET trait weights';
    ASSERT (SELECT count(*) FROM exams_colleges) = 38, 'all 37 draft routes plus NDA (a mistyped course drops a row)';
    ASSERT NOT EXISTS (SELECT 1 FROM exams_colleges WHERE source = 'Unverified draft' AND NOT estimated),
           'unverified figures are marked estimated';
END $$;

-- Known gaps, for fix/db-verify-college-data: careers with fewer than 3 undergraduate routes.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT c.name, count(ec.id) AS routes
        FROM careers c
        LEFT JOIN courses co ON co.career_id = c.id AND co.level = 'UG'
        LEFT JOIN exams_colleges ec ON ec.course_id = co.id
        GROUP BY c.name
        HAVING count(ec.id) < 3
        ORDER BY c.name
    LOOP
        RAISE NOTICE 'gap: % has % undergraduate route(s); the target is 3', r.name, r.routes;
    END LOOP;
END $$;

ROLLBACK;
