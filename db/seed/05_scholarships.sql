-- =============================================================================
-- Seed 05: scholarships whose rules the app can check from a family's profile.
--
-- Left out on purpose: schemes whose main rule can't be checked from the profile (INSPIRE-SHE's "top 1% of
-- your board") and schemes without a fixed amount (post-matric scholarships that reimburse fees).
-- A deadline is filled in only when a published source gives it.
-- =============================================================================

INSERT INTO scholarships
    (name, provider, amount, amount_period, deadline, income_limit, categories, states, min_percentage, gender,
     course_level, eligibility_text, source, source_url, as_of, estimated)
VALUES
    ('Central Sector Scheme of Scholarship for College and University Students', 'Ministry of Education',
     12000, 'per_year', NULL, 450000, '{}', '{}', NULL, NULL, 'UG',
     'Family income up to Rs 4.5 lakh a year and marks above the 80th percentile of your Class 12 board (in your '
     'stream), in a regular degree course. Rs 12,000 a year at graduation level (Rs 20,000 at postgraduate level); '
     'up to 82,000 new awards a year. Apply on the National Scholarship Portal.',
     'Ministry of Education, Central Sector Scheme of Scholarship', 'https://www.education.gov.in/node/255',
     DATE '2026-10-07', false),
    ('AICTE Pragati Scholarship for Girls (Degree)', 'AICTE',
     50000, 'per_year', NULL, 800000, '{}', '{}', NULL, 'female', 'UG',
     'For girls admitted to the first year of an AICTE-approved technical degree (such as B.Tech), with family income '
     'up to Rs 8 lakh a year; selected on Class 12 marks. Rs 50,000 a year for up to 4 years. Apply on the National '
     'Scholarship Portal.',
     'AICTE Pragati scheme page (2026-27 notification) and Thapar Institute''s 2026-27 notice',
     'https://www.aicte.gov.in/schemes/students-development-schemes/Pragati/General-Instructions',
     DATE '2026-10-07', false),
    ('Kotak Kanya Scholarship', 'Kotak Education Foundation',
     150000, 'per_year', DATE '2026-09-30', 600000, '{}', '{}', 75, 'female', 'UG',
     'For girls with at least 75% in Class 12 and family income up to Rs 6 lakh a year, in the first year of a '
     'professional degree (engineering, MBBS, architecture, design, integrated LLB and more) at an NIRF- or '
     'NAAC-accredited institute. Rs 1.5 lakh a year until graduation; 500 new scholars for 2026-27.',
     'Kotak Kanya Scholarship 2026-27, as reported by India CSR (Jul 2026)',
     'https://indiacsr.in/kotak-kanya-scholarship-2026-500-girls-to-receive-rs-1-5-lakh-annually/',
     DATE '2026-07-28', false)
ON CONFLICT (name) DO UPDATE SET
    provider = EXCLUDED.provider, amount = EXCLUDED.amount, amount_period = EXCLUDED.amount_period,
    deadline = EXCLUDED.deadline, income_limit = EXCLUDED.income_limit, categories = EXCLUDED.categories,
    states = EXCLUDED.states, min_percentage = EXCLUDED.min_percentage, gender = EXCLUDED.gender,
    course_level = EXCLUDED.course_level, eligibility_text = EXCLUDED.eligibility_text, source = EXCLUDED.source,
    source_url = EXCLUDED.source_url, as_of = EXCLUDED.as_of, estimated = EXCLUDED.estimated;

-- Which careers each scholarship applies to (the courses it covers).
INSERT INTO scholarship_careers (scholarship_id, career_id)
SELECT s.id, c.id
FROM (VALUES
    -- any regular degree course
    ('Central Sector Scheme of Scholarship for College and University Students', 'Software Engineer'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Data Scientist'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Mechanical Engineer'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Robotics Engineer'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Medical Doctor (MBBS)'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Biotechnology Researcher'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Chartered Accountant (CA)'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Investment Banker'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'UX/UI Designer'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Educational Policy Specialist'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Agricultural Scientist'),
    ('Central Sector Scheme of Scholarship for College and University Students', 'Corporate Lawyer'),
    -- AICTE-approved technical degrees (B.Tech)
    ('AICTE Pragati Scholarship for Girls (Degree)', 'Software Engineer'),
    ('AICTE Pragati Scholarship for Girls (Degree)', 'Mechanical Engineer'),
    ('AICTE Pragati Scholarship for Girls (Degree)', 'Robotics Engineer'),
    ('AICTE Pragati Scholarship for Girls (Degree)', 'Biotechnology Researcher'),
    -- professional degrees: engineering, MBBS, design, integrated LLB
    ('Kotak Kanya Scholarship', 'Software Engineer'),
    ('Kotak Kanya Scholarship', 'Mechanical Engineer'),
    ('Kotak Kanya Scholarship', 'Robotics Engineer'),
    ('Kotak Kanya Scholarship', 'Biotechnology Researcher'),
    ('Kotak Kanya Scholarship', 'Medical Doctor (MBBS)'),
    ('Kotak Kanya Scholarship', 'UX/UI Designer'),
    ('Kotak Kanya Scholarship', 'Corporate Lawyer')
) AS v(scholarship, career)
JOIN scholarships s ON s.name = v.scholarship
JOIN careers c ON c.name = v.career
ON CONFLICT DO NOTHING;
