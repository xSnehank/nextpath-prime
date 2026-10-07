-- =============================================================================
-- PRISM Engine Seed Script: 01_questions.sql
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Description:
-- Idempotent question bank seed for student assessment flows.
-- Retagged to match 13 core scoring dimensions (logical, numerical, verbal,
-- spatial, creative, realistic, investigative, artistic, social, enterprising,
-- conventional, analytical, structured).
-- Answer keys (correct choices, scoring weights) are stored exclusively in
-- answer_key to prevent exposure to DevTools via API options.
-- =============================================================================

INSERT INTO questions (audience, dimension, position, text, options, answer_key)
VALUES
-- =============================================================================
-- STUDENT APTITUDE QUESTIONS (Positions 1 to 12)
-- =============================================================================

-- Aptitude: Logical Reasoning (Positions 1-3)
(
    'student',
    'logical',
    1,
    'If all Coders write Logic, and some Logic writers use Python, which statement must be true?',
    '[
        {"id": "A", "text": "All Coders use Python"},
        {"id": "B", "text": "Some Coders might use Python"},
        {"id": "C", "text": "No Coders use Python"},
        {"id": "D", "text": "Python is the only programming language"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "B",
        "scoring": {"A": 0.0, "B": 1.0, "C": 0.0, "D": 0.0}
    }'::jsonb
),
(
    'student',
    'logical',
    2,
    'Find the missing number in the sequence: 3, 7, 15, 31, __?',
    '[
        {"id": "A", "text": "47"},
        {"id": "B", "text": "55"},
        {"id": "C", "text": "63"},
        {"id": "D", "text": "65"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "C",
        "scoring": {"A": 0.0, "B": 0.0, "C": 1.0, "D": 0.0}
    }'::jsonb
),
(
    'student',
    'logical',
    3,
    'In a certain code, "PRISM" is written as "QSJTN". How is "DATA" written in that code?',
    '[
        {"id": "A", "text": "EBUB"},
        {"id": "B", "text": "CZSZ"},
        {"id": "C", "text": "EBVA"},
        {"id": "D", "text": "DBUB"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "A",
        "scoring": {"A": 1.0, "B": 0.0, "C": 0.0, "D": 0.0}
    }'::jsonb
),

-- Aptitude: Numerical Reasoning (Positions 4-6)
(
    'student',
    'numerical',
    4,
    'A student scored 80% in an examination worth 150 total marks. How many marks did the student obtain?',
    '[
        {"id": "A", "text": "100"},
        {"id": "B", "text": "110"},
        {"id": "C", "text": "120"},
        {"id": "D", "text": "125"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "C",
        "scoring": {"A": 0.0, "B": 0.0, "C": 1.0, "D": 0.0}
    }'::jsonb
),
(
    'student',
    'numerical',
    5,
    'A car travels at a constant speed of 60 km/h. How many minutes will it take to cover a distance of 15 km?',
    '[
        {"id": "A", "text": "10 minutes"},
        {"id": "B", "text": "15 minutes"},
        {"id": "C", "text": "20 minutes"},
        {"id": "D", "text": "25 minutes"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "B",
        "scoring": {"A": 0.0, "B": 1.0, "C": 0.0, "D": 0.0}
    }'::jsonb
),
(
    'student',
    'numerical',
    6,
    'If the price of a textbook drops by 20% to ₹400, what was its original price before the discount?',
    '[
        {"id": "A", "text": "₹450"},
        {"id": "B", "text": "₹480"},
        {"id": "C", "text": "₹500"},
        {"id": "D", "text": "₹520"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "C",
        "scoring": {"A": 0.0, "B": 0.0, "C": 1.0, "D": 0.0}
    }'::jsonb
),

-- Aptitude: Verbal Reasoning (Positions 7-8)
(
    'student',
    'verbal',
    7,
    'Choose the word that is most nearly OPPOSITE in meaning to "OPTIONAL".',
    '[
        {"id": "A", "text": "Voluntary"},
        {"id": "B", "text": "Mandatory"},
        {"id": "C", "text": "Flexible"},
        {"id": "D", "text": "Elective"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "B",
        "scoring": {"A": 0.0, "B": 1.0, "C": 0.0, "D": 0.0}
    }'::jsonb
),
(
    'student',
    'verbal',
    8,
    'Complete the word analogy — Architect : Blueprint :: Author : ____.',
    '[
        {"id": "A", "text": "Novel"},
        {"id": "B", "text": "Pen"},
        {"id": "C", "text": "Manuscript"},
        {"id": "D", "text": "Library"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "C",
        "scoring": {"A": 0.0, "B": 0.0, "C": 1.0, "D": 0.0}
    }'::jsonb
),

-- Aptitude: Spatial Reasoning (Positions 9-10)
(
    'student',
    'spatial',
    9,
    'If a square sheet of paper is folded in half vertically and a circle punch is made in the top-right corner, how many holes appear when unfolded?',
    '[
        {"id": "A", "text": "1 hole"},
        {"id": "B", "text": "2 holes"},
        {"id": "C", "text": "3 holes"},
        {"id": "D", "text": "4 holes"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "B",
        "scoring": {"A": 0.0, "B": 1.0, "C": 0.0, "D": 0.0}
    }'::jsonb
),
(
    'student',
    'spatial',
    10,
    'Which 3D geometrical shape is formed by folding a 2D net consisting of 6 connected equal square faces?',
    '[
        {"id": "A", "text": "Square Pyramid"},
        {"id": "B", "text": "Cylinder"},
        {"id": "C", "text": "Cube"},
        {"id": "D", "text": "Cone"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "C",
        "scoring": {"A": 0.0, "B": 0.0, "C": 1.0, "D": 0.0}
    }'::jsonb
),

-- Aptitude: Creative Reasoning (Positions 11-12)
(
    'student',
    'creative',
    11,
    'Which of the following best demonstrates creative lateral thinking by connecting two seemingly unrelated domains: a living tree and a digital database?',
    '[
        {"id": "A", "text": "Both process sunlight to generate energy"},
        {"id": "B", "text": "Both use branching hierarchical structures to store and organize information"},
        {"id": "C", "text": "Neither can function in a digital environment"},
        {"id": "D", "text": "Both require physical soil for maintenance"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "B",
        "scoring": {"A": 0.0, "B": 1.0, "C": 0.0, "D": 0.0}
    }'::jsonb
),
(
    'student',
    'creative',
    12,
    'An engineer needs to design eco-friendly packaging that dissolves after use. Which approach represents a generative, creative innovation?',
    '[
        {"id": "A", "text": "Increasing plastic thickness to prevent leaks"},
        {"id": "B", "text": "Using water-soluble seaweed-based biomaterial"},
        {"id": "C", "text": "Eliminating all shipping containers completely"},
        {"id": "D", "text": "Replacing cardboard with metal cases"}
    ]'::jsonb,
    '{
        "type": "multiple_choice",
        "correct_choice": "B",
        "scoring": {"A": 0.0, "B": 1.0, "C": 0.0, "D": 0.0}
    }'::jsonb
),

-- =============================================================================
-- STUDENT INTEREST QUESTIONS (Holland RIASEC - Positions 13 to 22)
-- =============================================================================
(
    'student',
    'investigative',
    13,
    'I enjoy writing code, building mobile apps, or configuring computer software.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'investigative',
    14,
    'I like searching for hidden patterns in numerical datasets, charts, and scientific experiments.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'artistic',
    15,
    'I enjoy creating visual artwork, designing app interfaces, or editing digital graphics.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'social',
    16,
    'I feel fulfilled when mentoring peers, teaching concepts, or helping people overcome problems.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'enterprising',
    17,
    'I enjoy pitching project ideas, leading teams, or organizing school and college events.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'conventional',
    18,
    'I prefer managing structured accounts, organizing schedules, and reviewing financial records.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'investigative',
    19,
    'I am fascinated by biological systems, medical research, and improving human health.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'realistic',
    20,
    'I am passionate about solving environmental challenges, renewable energy, and eco-friendly solutions.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'enterprising',
    21,
    'I enjoy debating social issues, understanding legal policies, and analyzing governance rules.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'artistic',
    22,
    'I enjoy writing articles, creating podcasts, or communicating ideas across public media platforms.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),

-- =============================================================================
-- STUDENT COGNITIVE STYLE QUESTIONS (Positions 23 to 32)
-- =============================================================================
(
    'student',
    'analytical',
    23,
    'When approaching a problem, I prefer using logical step-by-step formulas over intuitive brainstorming.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'analytical',
    24,
    'I perform best when working independently on analytical problems rather than in social group settings.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'structured',
    25,
    'I prefer clear, well-defined project instructions over open-ended, flexible assignments.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'analytical',
    26,
    'I focus deeply on technical precision and granular details rather than high-level strategic vision.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'analytical',
    27,
    'I prefer studying theoretical concepts and principles before attempting practical building.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'structured',
    28,
    'I prefer using tried-and-tested standard methods over experimenting with novel, unproven techniques.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'analytical',
    29,
    'I understand complex ideas better through written text and analytical logic than visual diagrams.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'structured',
    30,
    'I prefer focusing on completing one single task thoroughly before starting another.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'analytical',
    31,
    'I spend significant time evaluating options and consequences before taking action.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
),
(
    'student',
    'structured',
    32,
    'I prefer sticking to organized routines rather than changing plans unexpectedly.',
    '[
        {"value": 1, "text": "Strongly Disagree"},
        {"value": 2, "text": "Disagree"},
        {"value": 3, "text": "Neutral"},
        {"value": 4, "text": "Agree"},
        {"value": 5, "text": "Strongly Agree"}
    ]'::jsonb,
    '{
        "type": "likert_5",
        "scoring": {"1": 0.0, "2": 0.25, "3": 0.5, "4": 0.75, "5": 1.0}
    }'::jsonb
)

ON CONFLICT (audience, position) DO UPDATE SET
    dimension = EXCLUDED.dimension,
    text = EXCLUDED.text,
    options = EXCLUDED.options,
    answer_key = EXCLUDED.answer_key;
