-- =============================================================================
-- Seed 01: the student question bank (33 questions). Parents get no questions: their assessment is the
-- profile form (PUT /profile).
--
-- A prototype for the hackathon, NOT a validated psychometric instrument.
-- - 10 graded aptitude questions ('choice'): correct = 1, wrong = 0. Correct answers are spread over A-D.
-- - 23 statements rated 1-5 ('likert'), tagged with the 13 dimensions of the backend guide (section 4).
--   Question 33 is reverse-scored: agreeing means a more flexible, less structured style.
-- Most items are Joel's original bank, retagged. Items 11, 12, 13, 21 and 25 are new, and 8 is reworded so
-- only one answer fits.
--
-- Ids never change; positions (display order) may. Re-running updates every row.
-- =============================================================================

WITH likert(options) AS (
    VALUES ('[{"value": 1, "label": "Strongly disagree"}, {"value": 2, "label": "Disagree"},
              {"value": 3, "label": "Neutral"}, {"value": 4, "label": "Agree"},
              {"value": 5, "label": "Strongly agree"}]'::jsonb)
)
INSERT INTO questions (id, audience, position, kind, dimension, text, options, correct_value, reverse_scored)
SELECT q.id::uuid, 'student', q.position, q.kind, q.dimension, q.text,
       coalesce(q.choices, likert.options), q.correct_value, q.reverse_scored
FROM likert,
(VALUES
    -- aptitude, graded
    ('b0000000-0000-4000-8000-000000000001', 1, 'choice', 'logical',
     'If all Coders write Logic, and some Logic writers use Python, which statement must be true?',
     '[{"value": 1, "label": "All Coders use Python"}, {"value": 2, "label": "Some Coders might use Python"},
       {"value": 3, "label": "No Coders use Python"}, {"value": 4, "label": "Python is the only programming language"}]'::jsonb,
     2, false),
    ('b0000000-0000-4000-8000-000000000002', 2, 'choice', 'logical',
     'Find the missing number in the sequence: 3, 7, 15, 31, __?',
     '[{"value": 1, "label": "47"}, {"value": 2, "label": "55"}, {"value": 3, "label": "61"}, {"value": 4, "label": "63"}]',
     4, false),
    ('b0000000-0000-4000-8000-000000000003', 3, 'choice', 'logical',
     'In a certain code, "PRISM" is written as "QSJTN". How is "DATA" written in that code?',
     '[{"value": 1, "label": "EBUB"}, {"value": 2, "label": "CZSZ"}, {"value": 3, "label": "EBVA"}, {"value": 4, "label": "DBUB"}]',
     1, false),
    ('b0000000-0000-4000-8000-000000000004', 4, 'choice', 'numerical',
     'A student scored 80% in an examination worth 150 total marks. How many marks did the student obtain?',
     '[{"value": 1, "label": "110"}, {"value": 2, "label": "120"}, {"value": 3, "label": "125"}, {"value": 4, "label": "130"}]',
     2, false),
    ('b0000000-0000-4000-8000-000000000005', 5, 'choice', 'numerical',
     'A car travels at a constant speed of 60 km/h. How many minutes will it take to cover a distance of 15 km?',
     '[{"value": 1, "label": "15 minutes"}, {"value": 2, "label": "20 minutes"},
       {"value": 3, "label": "25 minutes"}, {"value": 4, "label": "30 minutes"}]',
     1, false),
    ('b0000000-0000-4000-8000-000000000006', 6, 'choice', 'numerical',
     'If the price of a textbook drops by 20% to ₹400, what was its original price before the discount?',
     '[{"value": 1, "label": "₹420"}, {"value": 2, "label": "₹450"}, {"value": 3, "label": "₹480"}, {"value": 4, "label": "₹500"}]',
     4, false),
    ('b0000000-0000-4000-8000-000000000007', 7, 'choice', 'verbal',
     'Choose the word that is most nearly OPPOSITE in meaning to "OPTIONAL".',
     '[{"value": 1, "label": "Voluntary"}, {"value": 2, "label": "Elective"},
       {"value": 3, "label": "Mandatory"}, {"value": 4, "label": "Flexible"}]',
     3, false),
    ('b0000000-0000-4000-8000-000000000008', 8, 'choice', 'verbal',
     'Complete the analogy: Architect : Building :: Author : ____.',
     '[{"value": 1, "label": "Pen"}, {"value": 2, "label": "Library"}, {"value": 3, "label": "Book"}, {"value": 4, "label": "Reader"}]',
     3, false),
    ('b0000000-0000-4000-8000-000000000009', 9, 'choice', 'spatial',
     'A square sheet of paper is folded in half vertically, and a hole is punched through the top-right corner '
     'of the folded sheet. How many holes are there when it is unfolded?',
     '[{"value": 1, "label": "1"}, {"value": 2, "label": "2"}, {"value": 3, "label": "3"}, {"value": 4, "label": "4"}]',
     2, false),
    ('b0000000-0000-4000-8000-000000000010', 10, 'choice', 'spatial',
     'Which 3D shape do you get by folding a flat net of 6 connected, equal squares?',
     '[{"value": 1, "label": "Square pyramid"}, {"value": 2, "label": "Cylinder"},
       {"value": 3, "label": "Cube"}, {"value": 4, "label": "Cone"}]',
     3, false),

    -- aptitude, rated
    ('b0000000-0000-4000-8000-000000000011', 11, 'likert', 'creative',
     'I often think of unusual ways to use everyday objects.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000012', 12, 'likert', 'creative',
     'I enjoy coming up with ideas, stories or designs that are my own.', NULL, NULL, false),

    -- interests (the six Holland types)
    ('b0000000-0000-4000-8000-000000000013', 13, 'likert', 'realistic',
     'I like working with tools, machines or my hands to build or fix things.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000014', 14, 'likert', 'realistic',
     'I am passionate about solving environmental challenges, renewable energy, and eco-friendly solutions.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000015', 15, 'likert', 'investigative',
     'I enjoy writing code, building mobile apps, or configuring computer software.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000016', 16, 'likert', 'investigative',
     'I like searching for hidden patterns in numerical datasets, charts, and scientific experiments.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000017', 17, 'likert', 'investigative',
     'I am fascinated by biological systems, medical research, and improving human health.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000018', 18, 'likert', 'artistic',
     'I enjoy creating visual artwork, designing app interfaces, or editing digital graphics.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000019', 19, 'likert', 'artistic',
     'I enjoy writing articles, creating podcasts, or communicating ideas across public media platforms.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000020', 20, 'likert', 'social',
     'I feel fulfilled when mentoring peers, teaching concepts, or helping people overcome problems.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000021', 21, 'likert', 'social',
     'I would enjoy a job caring for or counselling people.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000022', 22, 'likert', 'enterprising',
     'I enjoy pitching project ideas, leading teams, or organizing school and college events.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000023', 23, 'likert', 'enterprising',
     'I enjoy debating social issues, understanding legal policies, and analyzing governance rules.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000024', 24, 'likert', 'conventional',
     'I prefer managing structured accounts, organizing schedules, and reviewing financial records.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000025', 25, 'likert', 'conventional',
     'I like keeping information organised and following clear procedures.', NULL, NULL, false),

    -- thinking style: analytical (low = intuitive) and structured (low = flexible)
    ('b0000000-0000-4000-8000-000000000026', 26, 'likert', 'analytical',
     'When approaching a problem, I prefer using logical step-by-step formulas over creative brainstorming.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000027', 27, 'likert', 'analytical',
     'I focus deeply on technical precision and granular details rather than high-level strategic vision.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000028', 28, 'likert', 'analytical',
     'I prefer studying theoretical concepts and principles before attempting practical building.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000029', 29, 'likert', 'analytical',
     'I spend significant time evaluating options and consequences before taking action.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000030', 30, 'likert', 'structured',
     'I prefer clear, well-defined project instructions over open-ended, flexible assignments.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000031', 31, 'likert', 'structured',
     'I prefer using tried-and-tested standard methods over experimenting with novel, unproven techniques.',
     NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000032', 32, 'likert', 'structured',
     'I prefer focusing on completing one single task thoroughly before starting another.', NULL, NULL, false),
    ('b0000000-0000-4000-8000-000000000033', 33, 'likert', 'structured',
     'I adapt comfortably when plans change unexpectedly without feeling disoriented.', NULL, NULL, true)
) AS q(id, position, kind, dimension, text, choices, correct_value, reverse_scored)
ON CONFLICT (id) DO UPDATE SET
    audience       = EXCLUDED.audience,
    position       = EXCLUDED.position,
    kind           = EXCLUDED.kind,
    dimension      = EXCLUDED.dimension,
    text           = EXCLUDED.text,
    options        = EXCLUDED.options,
    correct_value  = EXCLUDED.correct_value,
    reverse_scored = EXCLUDED.reverse_scored;
