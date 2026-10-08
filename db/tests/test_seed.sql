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
    ASSERT (SELECT count(*) FROM careers) = 56, '56 careers (db/data/careers.csv)';
    ASSERT NOT EXISTS (SELECT 1 FROM careers c
                       WHERE NOT EXISTS (SELECT 1 FROM courses co WHERE co.career_id = c.id AND co.level = 'UG')),
           'every career has an undergraduate course';
    ASSERT NOT EXISTS (SELECT 1 FROM careers WHERE trait_weights IS NULL), 'every career has O*NET trait weights';
    ASSERT NOT EXISTS (SELECT 1 FROM careers c WHERE NOT EXISTS (
        SELECT 1 FROM market_data m WHERE m.career_id = c.id AND m.region = 'India' AND m.entry_salary IS NOT NULL)),
           'every career has a national market row with a starting salary';
    ASSERT NOT EXISTS (SELECT 1 FROM careers c WHERE NOT EXISTS (
        SELECT 1 FROM courses co JOIN exams_colleges ec ON ec.course_id = co.id
        WHERE co.career_id = c.id AND co.level = 'UG' AND ec.annual_fee IS NOT NULL)),
           'every career has an undergraduate route with a known fee, so the solver can cost it';
    ASSERT EXISTS (SELECT 1 FROM regions WHERE name = 'India'), 'the national living cost is loaded';
    ASSERT (SELECT count(*) FROM scholarships) = 3 AND (SELECT count(*) FROM scholarship_careers) = 102, 'scholarships';

    -- the catalog (db/data/*.csv, built by db/scripts/build_catalog.py)
    ASSERT (SELECT count(*) FROM exams_colleges) = 2811, '2811 routes (a mistyped career or course drops rows)';
    ASSERT (SELECT count(DISTINCT college) FROM exams_colleges) >= 200, 'at least 200 colleges';
    ASSERT (SELECT count(DISTINCT name) FROM courses WHERE level = 'UG') >= 20, 'at least 20 degree programmes';
    ASSERT NOT EXISTS (SELECT 1 FROM exams_colleges WHERE source = 'Unverified draft'), 'the old draft rows are gone';
    ASSERT NOT EXISTS (SELECT 1 FROM exams_colleges WHERE tier IS NULL
                       AND college NOT IN ('Institute of Chartered Accountants of India (ICAI)',
                                           'Institute of Company Secretaries of India (ICSI)',
                                           'Institute of Cost Accountants of India (ICMAI)',
                                           'National Defence Academy, Khadakwasla')),
           'every college has a tier; only the professional bodies and NDA have none';
    ASSERT (SELECT count(DISTINCT tier) FROM exams_colleges) = 3, 'all three tiers are present';

    -- streams: every stream has careers of its own, and the regulators' minimums hold
    ASSERT NOT EXISTS (
        SELECT 1 FROM unnest(ARRAY['science_pcm', 'science_pcb', 'science_pcmb', 'commerce_maths', 'commerce', 'arts']) AS s
        WHERE (SELECT count(DISTINCT co.career_id) FROM courses co WHERE s = ANY (co.primary_streams::text[])) < 5
    ), 'every stream has at least 5 careers of its own';
    ASSERT NOT EXISTS (SELECT 1 FROM courses WHERE (name LIKE 'B.Tech%' OR name LIKE 'B.E.%')
                       AND 'science_pcb' = ANY (eligible_streams::text[])),
           'B.Tech / B.E. needs Physics and Mathematics (AICTE): PCB alone is not eligible';
    ASSERT NOT EXISTS (SELECT 1 FROM courses WHERE name LIKE 'Bachelor of Medicine%'
                       AND 'science_pcm' = ANY (eligible_streams::text[])),
           'MBBS needs Biology (NMC): PCM alone is not eligible';
    ASSERT NOT EXISTS (SELECT 1 FROM courses co JOIN careers c ON c.id = co.career_id
                       WHERE c.name = 'Chartered Accountant (CA)' AND 'science_pcm' = ANY (co.primary_streams::text[])),
           'CA is open to a PCM student but never one of their own-stream careers';
END $$;

-- Known gaps: careers with fewer than 3 undergraduate routes.
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
