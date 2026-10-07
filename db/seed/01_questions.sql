-- =============================================================================
-- PRISM Engine Seed Script: 01_questions.sql
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Description:
-- Idempotent question bank seed for student and parent assessment flows.
--
-- NOTE:
-- This is a prototype question bank designed for testing and development in the
-- PRISM Engine. It is NOT a validated psychometric instrument.
-- =============================================================================

INSERT INTO questions (audience, dimension, position, text, options)
VALUES
-- =============================================================================
-- STUDENT QUESTIONS (audience = 'student', positions 1 to 30)
-- =============================================================================

-- Aptitude: Logical Reasoning (Positions 1-3)
(
    'student',
    'aptitude_logical',
    1,
    'If all Coders write Logic, and some Logic writers use Python, which statement must be true?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "All Coders use Python", "correct": false},
            {"id": "B", "text": "Some Coders might use Python", "correct": true},
            {"id": "C", "text": "No Coders use Python", "correct": false},
            {"id": "D", "text": "Python is the only programming language", "correct": false}
        ],
        "weights": {
            "A": {"logical_aptitude": 0.0},
            "B": {"logical_aptitude": 1.0},
            "C": {"logical_aptitude": 0.0},
            "D": {"logical_aptitude": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'aptitude_logical',
    2,
    'Find the missing number in the sequence: 3, 7, 15, 31, __?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "47", "correct": false},
            {"id": "B", "text": "55", "correct": false},
            {"id": "C", "text": "63", "correct": true},
            {"id": "D", "text": "65", "correct": false}
        ],
        "weights": {
            "A": {"logical_aptitude": 0.0},
            "B": {"logical_aptitude": 0.0},
            "C": {"logical_aptitude": 1.0},
            "D": {"logical_aptitude": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'aptitude_logical',
    3,
    'In a certain code, "PRISM" is written as "QSJTN". How is "DATA" written in that code?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "EBUB", "correct": true},
            {"id": "B", "text": "CZSZ", "correct": false},
            {"id": "C", "text": "EBVA", "correct": false},
            {"id": "D", "text": "DBUB", "correct": false}
        ],
        "weights": {
            "A": {"logical_aptitude": 1.0},
            "B": {"logical_aptitude": 0.0},
            "C": {"logical_aptitude": 0.0},
            "D": {"logical_aptitude": 0.0}
        }
    }'::jsonb
),

-- Aptitude: Numerical Reasoning (Positions 4-6)
(
    'student',
    'aptitude_numerical',
    4,
    'A student scored 80% in an examination worth 150 total marks. How many marks did the student obtain?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "100", "correct": false},
            {"id": "B", "text": "110", "correct": false},
            {"id": "C", "text": "120", "correct": true},
            {"id": "D", "text": "125", "correct": false}
        ],
        "weights": {
            "A": {"numerical_aptitude": 0.0},
            "B": {"numerical_aptitude": 0.0},
            "C": {"numerical_aptitude": 1.0},
            "D": {"numerical_aptitude": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'aptitude_numerical',
    5,
    'A car travels at a constant speed of 60 km/h. How many minutes will it take to cover a distance of 15 km?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "10 minutes", "correct": false},
            {"id": "B", "text": "15 minutes", "correct": true},
            {"id": "C", "text": "20 minutes", "correct": false},
            {"id": "D", "text": "25 minutes", "correct": false}
        ],
        "weights": {
            "A": {"numerical_aptitude": 0.0},
            "B": {"numerical_aptitude": 1.0},
            "C": {"numerical_aptitude": 0.0},
            "D": {"numerical_aptitude": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'aptitude_numerical',
    6,
    'If the price of a textbook drops by 20% to ₹400, what was its original price before the discount?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "₹450", "correct": false},
            {"id": "B", "text": "₹480", "correct": false},
            {"id": "C", "text": "₹500", "correct": true},
            {"id": "D", "text": "₹520", "correct": false}
        ],
        "weights": {
            "A": {"numerical_aptitude": 0.0},
            "B": {"numerical_aptitude": 0.0},
            "C": {"numerical_aptitude": 1.0},
            "D": {"numerical_aptitude": 0.0}
        }
    }'::jsonb
),

-- Aptitude: Verbal Reasoning (Positions 7-8)
(
    'student',
    'aptitude_verbal',
    7,
    'Choose the word that is most nearly OPPOSITE in meaning to "OPTIONAL".',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "Voluntary", "correct": false},
            {"id": "B", "text": "Mandatory", "correct": true},
            {"id": "C", "text": "Flexible", "correct": false},
            {"id": "D", "text": "Elective", "correct": false}
        ],
        "weights": {
            "A": {"verbal_aptitude": 0.0},
            "B": {"verbal_aptitude": 1.0},
            "C": {"verbal_aptitude": 0.0},
            "D": {"verbal_aptitude": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'aptitude_verbal',
    8,
    'Complete the word analogy — Architect : Blueprint :: Author : ____.',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "Novel", "correct": false},
            {"id": "B", "text": "Pen", "correct": false},
            {"id": "C", "text": "Manuscript", "correct": true},
            {"id": "D", "text": "Library", "correct": false}
        ],
        "weights": {
            "A": {"verbal_aptitude": 0.0},
            "B": {"verbal_aptitude": 0.0},
            "C": {"verbal_aptitude": 1.0},
            "D": {"verbal_aptitude": 0.0}
        }
    }'::jsonb
),

-- Aptitude: Spatial Reasoning (Positions 9-10)
(
    'student',
    'aptitude_spatial',
    9,
    'If a square sheet of paper is folded in half vertically and a circle punch is made in the top-right corner, how many holes appear when unfolded?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "1 hole", "correct": false},
            {"id": "B", "text": "2 holes", "correct": true},
            {"id": "C", "text": "3 holes", "correct": false},
            {"id": "D", "text": "4 holes", "correct": false}
        ],
        "weights": {
            "A": {"spatial_aptitude": 0.0},
            "B": {"spatial_aptitude": 1.0},
            "C": {"spatial_aptitude": 0.0},
            "D": {"spatial_aptitude": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'aptitude_spatial',
    10,
    'Which 3D geometrical shape is formed by folding a 2D net consisting of 6 connected equal square faces?',
    '{
        "type": "multiple_choice",
        "choices": [
            {"id": "A", "text": "Square Pyramid", "correct": false},
            {"id": "B", "text": "Cylinder", "correct": false},
            {"id": "C", "text": "Cube", "correct": true},
            {"id": "D", "text": "Cone", "correct": false}
        ],
        "weights": {
            "A": {"spatial_aptitude": 0.0},
            "B": {"spatial_aptitude": 0.0},
            "C": {"spatial_aptitude": 1.0},
            "D": {"spatial_aptitude": 0.0}
        }
    }'::jsonb
),

-- Interest Dimensions (Positions 11-20, 5-point Likert)
(
    'student',
    'interest_tech',
    11,
    'I enjoy writing code, building mobile apps, or configuring computer software.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"engineering_interest": 0.0},
            "2": {"engineering_interest": 0.25},
            "3": {"engineering_interest": 0.5},
            "4": {"engineering_interest": 0.75},
            "5": {"engineering_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_data',
    12,
    'I like searching for hidden patterns in numerical datasets, charts, and scientific experiments.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"data_science_interest": 0.0},
            "2": {"data_science_interest": 0.25},
            "3": {"data_science_interest": 0.5},
            "4": {"data_science_interest": 0.75},
            "5": {"data_science_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_design',
    13,
    'I enjoy creating visual artwork, designing app interfaces, or editing digital graphics.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"creative_design_interest": 0.0},
            "2": {"creative_design_interest": 0.25},
            "3": {"creative_design_interest": 0.5},
            "4": {"creative_design_interest": 0.75},
            "5": {"creative_design_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_social',
    14,
    'I feel fulfilled when mentoring peers, teaching concepts, or helping people overcome problems.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"social_teaching_interest": 0.0},
            "2": {"social_teaching_interest": 0.25},
            "3": {"social_teaching_interest": 0.5},
            "4": {"social_teaching_interest": 0.75},
            "5": {"social_teaching_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_business',
    15,
    'I enjoy pitching project ideas, leading teams, or organizing school and college events.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"business_leadership_interest": 0.0},
            "2": {"business_leadership_interest": 0.25},
            "3": {"business_leadership_interest": 0.5},
            "4": {"business_leadership_interest": 0.75},
            "5": {"business_leadership_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_finance',
    16,
    'I prefer managing structured accounts, organizing schedules, and reviewing financial records.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"finance_operations_interest": 0.0},
            "2": {"finance_operations_interest": 0.25},
            "3": {"finance_operations_interest": 0.5},
            "4": {"finance_operations_interest": 0.75},
            "5": {"finance_operations_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_healthcare',
    17,
    'I am fascinated by biological systems, medical research, and improving human health.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"healthcare_bio_interest": 0.0},
            "2": {"healthcare_bio_interest": 0.25},
            "3": {"healthcare_bio_interest": 0.5},
            "4": {"healthcare_bio_interest": 0.75},
            "5": {"healthcare_bio_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_sustainability',
    18,
    'I am passionate about solving environmental challenges, renewable energy, and eco-friendly solutions.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"sustainability_interest": 0.0},
            "2": {"sustainability_interest": 0.25},
            "3": {"sustainability_interest": 0.5},
            "4": {"sustainability_interest": 0.75},
            "5": {"sustainability_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_law_policy',
    19,
    'I enjoy debating social issues, understanding legal policies, and analyzing governance rules.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"law_policy_interest": 0.0},
            "2": {"law_policy_interest": 0.25},
            "3": {"law_policy_interest": 0.5},
            "4": {"law_policy_interest": 0.75},
            "5": {"law_policy_interest": 1.0}
        }
    }'::jsonb
),
(
    'student',
    'interest_media',
    20,
    'I enjoy writing articles, creating podcasts, or communicating ideas across public media platforms.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"media_communication_interest": 0.0},
            "2": {"media_communication_interest": 0.25},
            "3": {"media_communication_interest": 0.5},
            "4": {"media_communication_interest": 0.75},
            "5": {"media_communication_interest": 1.0}
        }
    }'::jsonb
),

-- Thinking-Style Dimensions (Positions 21-30, 5-point Likert)
(
    'student',
    'thinking_analytical_vs_creative',
    21,
    'When approaching a problem, I prefer using logical step-by-step formulas over creative brainstorming.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"analytical_thinking": 0.0, "creative_thinking": 1.0},
            "2": {"analytical_thinking": 0.25, "creative_thinking": 0.75},
            "3": {"analytical_thinking": 0.5, "creative_thinking": 0.5},
            "4": {"analytical_thinking": 0.75, "creative_thinking": 0.25},
            "5": {"analytical_thinking": 1.0, "creative_thinking": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_solo_vs_team',
    22,
    'I perform best when working independently rather than collaborating in large team groups.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"solo_preference": 0.0, "team_preference": 1.0},
            "2": {"solo_preference": 0.25, "team_preference": 0.75},
            "3": {"solo_preference": 0.5, "team_preference": 0.5},
            "4": {"solo_preference": 0.75, "team_preference": 0.25},
            "5": {"solo_preference": 1.0, "team_preference": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_structured_vs_open',
    23,
    'I prefer clear, well-defined project instructions over open-ended, flexible assignments.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"structured_preference": 0.0, "open_ended_preference": 1.0},
            "2": {"structured_preference": 0.25, "open_ended_preference": 0.75},
            "3": {"structured_preference": 0.5, "open_ended_preference": 0.5},
            "4": {"structured_preference": 0.75, "open_ended_preference": 0.25},
            "5": {"structured_preference": 1.0, "open_ended_preference": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_detail_vs_bigpicture',
    24,
    'I focus deeply on technical precision and granular details rather than high-level strategic vision.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"detail_orientation": 0.0, "big_picture_orientation": 1.0},
            "2": {"detail_orientation": 0.25, "big_picture_orientation": 0.75},
            "3": {"detail_orientation": 0.5, "big_picture_orientation": 0.5},
            "4": {"detail_orientation": 0.75, "big_picture_orientation": 0.25},
            "5": {"detail_orientation": 1.0, "big_picture_orientation": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_theory_vs_practical',
    25,
    'I prefer studying theoretical concepts and principles before attempting practical building.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"theoretical_preference": 0.0, "practical_preference": 1.0},
            "2": {"theoretical_preference": 0.25, "practical_preference": 0.75},
            "3": {"theoretical_preference": 0.5, "practical_preference": 0.5},
            "4": {"theoretical_preference": 0.75, "practical_preference": 0.25},
            "5": {"theoretical_preference": 1.0, "practical_preference": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_risk_vs_proven',
    26,
    'I prefer using tried-and-tested standard methods over experimenting with novel, unproven techniques.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"proven_methods_preference": 0.0, "experimental_preference": 1.0},
            "2": {"proven_methods_preference": 0.25, "experimental_preference": 0.75},
            "3": {"proven_methods_preference": 0.5, "experimental_preference": 0.5},
            "4": {"proven_methods_preference": 0.75, "experimental_preference": 0.25},
            "5": {"proven_methods_preference": 1.0, "experimental_preference": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_verbal_vs_visual',
    27,
    'I understand complex ideas better through written text and verbal explanations than visual diagrams.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"verbal_learning": 0.0, "visual_learning": 1.0},
            "2": {"verbal_learning": 0.25, "visual_learning": 0.75},
            "3": {"verbal_learning": 0.5, "visual_learning": 0.5},
            "4": {"verbal_learning": 0.75, "visual_learning": 0.25},
            "5": {"verbal_learning": 1.0, "visual_learning": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_sequential_vs_parallel',
    28,
    'I prefer focusing on completing one single task thoroughly before starting another.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"sequential_focus": 0.0, "multitasking_focus": 1.0},
            "2": {"sequential_focus": 0.25, "multitasking_focus": 0.75},
            "3": {"sequential_focus": 0.5, "multitasking_focus": 0.5},
            "4": {"sequential_focus": 0.75, "multitasking_focus": 0.25},
            "5": {"sequential_focus": 1.0, "multitasking_focus": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_reflective_vs_action',
    29,
    'I spend significant time evaluating options and consequences before taking action.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"reflective_style": 0.0, "impulsive_action_style": 1.0},
            "2": {"reflective_style": 0.25, "impulsive_action_style": 0.75},
            "3": {"reflective_style": 0.5, "impulsive_action_style": 0.5},
            "4": {"reflective_style": 0.75, "impulsive_action_style": 0.25},
            "5": {"reflective_style": 1.0, "impulsive_action_style": 0.0}
        }
    }'::jsonb
),
(
    'student',
    'thinking_adaptable_vs_routine',
    30,
    'I adapt comfortably when plans change unexpectedly without feeling disoriented.',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "Strongly Disagree"},
            {"value": 2, "text": "Disagree"},
            {"value": 3, "text": "Neutral"},
            {"value": 4, "text": "Agree"},
            {"value": 5, "text": "Strongly Agree"}
        ],
        "weights": {
            "1": {"adaptability": 0.0, "routine_preference": 1.0},
            "2": {"adaptability": 0.25, "routine_preference": 0.75},
            "3": {"adaptability": 0.5, "routine_preference": 0.5},
            "4": {"adaptability": 0.75, "routine_preference": 0.25},
            "5": {"adaptability": 1.0, "routine_preference": 0.0}
        }
    }'::jsonb
),

-- =============================================================================
-- PARENT QUESTIONS (audience = 'parent', positions 1 to 5)
-- =============================================================================

-- Budget (Position 1)
(
    'parent',
    'financial_budget',
    1,
    'What is your total affordable annual spend (in ₹ Rupees) for your child''s higher education?',
    '{
        "type": "numeric_input",
        "currency": "INR",
        "unit": "rupees_per_year",
        "placeholder": "e.g. 500000",
        "min": 0,
        "step": 10000,
        "weights": {
            "annual_budget_inr": 1.0
        }
    }'::jsonb
),

-- Savings (Position 2)
(
    'parent',
    'financial_savings',
    2,
    'How much existing savings (in ₹ Rupees) have you set aside specifically for your child''s higher education?',
    '{
        "type": "numeric_input",
        "currency": "INR",
        "unit": "rupees_total",
        "placeholder": "e.g. 200000",
        "min": 0,
        "step": 10000,
        "weights": {
            "savings_inr": 1.0
        }
    }'::jsonb
),

-- Loan Comfort (Position 3)
(
    'parent',
    'financial_loan',
    3,
    'What is your maximum comfort level regarding taking an education loan for higher education?',
    '{
        "type": "single_choice",
        "choices": [
            {"value": 0, "label": "No loan (₹0)"},
            {"value": 200000, "label": "Up to ₹2 Lakh"},
            {"value": 500000, "label": "Up to ₹5 Lakh"},
            {"value": 1000000, "label": "Up to ₹10 Lakh"},
            {"value": 2000000, "label": "More than ₹10 Lakh"}
        ],
        "weights": {
            "0": {"loan_tolerance_inr": 0},
            "200000": {"loan_tolerance_inr": 200000},
            "500000": {"loan_tolerance_inr": 500000},
            "1000000": {"loan_tolerance_inr": 1000000},
            "2000000": {"loan_tolerance_inr": 2000000}
        }
    }'::jsonb
),

-- Risk Appetite (Position 4)
(
    'parent',
    'financial_risk',
    4,
    'How would you rate your financial risk appetite regarding career path selection (1 = Very Safe, 5 = Comfortable with Risk)?',
    '{
        "type": "likert_5",
        "choices": [
            {"value": 1, "text": "1 - Very Safe (Established fields only)"},
            {"value": 2, "text": "2 - Moderately Safe"},
            {"value": 3, "text": "3 - Balanced"},
            {"value": 4, "text": "4 - Growth-Oriented"},
            {"value": 5, "text": "5 - Comfortable with Risk (Emerging fields)"}
        ],
        "weights": {
            "1": {"risk_appetite_score": 1},
            "2": {"risk_appetite_score": 2},
            "3": {"risk_appetite_score": 3},
            "4": {"risk_appetite_score": 4},
            "5": {"risk_appetite_score": 5}
        }
    }'::jsonb
),

-- Domain Preferences (Position 5 - stored in parent_domain_prefs)
(
    'parent',
    'hoped_domains',
    5,
    'Select and rank up to 3 career domains you hope your child pursues.',
    '{
        "type": "rank_domains",
        "max_ranks": 3,
        "weights": {
            "parent_preference": 1.0
        }
    }'::jsonb
)

ON CONFLICT (audience, position) DO UPDATE SET
    dimension = EXCLUDED.dimension,
    text = EXCLUDED.text,
    options = EXCLUDED.options;
