-- =============================================================================
-- PRISM Engine Seed Script: 02_careers_courses.sql
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Description:
-- Idempotent seed for Domains, Careers, Courses, and Exams & Colleges.
-- Covers 8 domains, 12 careers, 24 courses, and 37 exam/college pairings.
-- =============================================================================

-- =============================================================================
-- 1. DOMAINS SEED
-- =============================================================================
INSERT INTO domains (name, description) VALUES
('Technology and AI', 'Software development, artificial intelligence, data science, and computing technologies'),
('Engineering and Manufacturing', 'Core engineering branches, robotics, mechanics, and physical product design'),
('Healthcare and Life Sciences', 'Clinical medicine, biotechnology research, pharmaceutical, and healthcare systems'),
('Business and Finance', 'Financial analysis, investment banking, accounting, and corporate management'),
('Creative and Design', 'User experience, visual communication, industrial design, and media arts'),
('Education and Social Impact', 'Educational policy, social service research, pedagogy, and public advocacy'),
('Agriculture and Sustainability', 'Agronomy, sustainable resource management, and environmental science'),
('Public Service and Law', 'Legal advocacy, corporate law, public policy, and administrative services')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description;

-- =============================================================================
-- 2. CAREERS SEED
-- =============================================================================
INSERT INTO careers (name, domain_id, education_path, avg_course_cost) VALUES
(
    'Software Engineer',
    (SELECT id FROM domains WHERE name = 'Technology and AI'),
    '12th Science (PCM) -> B.Tech in CSE / IT -> Optional M.Tech or MS',
    800000.00
),
(
    'Data Scientist',
    (SELECT id FROM domains WHERE name = 'Technology and AI'),
    '12th Science/Commerce with Math -> B.Sc / BS in Data Science or B.Tech -> M.Sc in Data Science / AI',
    650000.00
),
(
    'Mechanical Engineer',
    (SELECT id FROM domains WHERE name = 'Engineering and Manufacturing'),
    '12th Science (PCM) -> B.Tech in Mechanical Engineering -> Optional M.Tech in Design/Thermal',
    750000.00
),
(
    'Robotics Engineer',
    (SELECT id FROM domains WHERE name = 'Engineering and Manufacturing'),
    '12th Science (PCM) -> B.Tech in Mechatronics/Robotics -> M.Tech in Robotics & Automation',
    900000.00
),
(
    'Medical Doctor (MBBS)',
    (SELECT id FROM domains WHERE name = 'Healthcare and Life Sciences'),
    '12th Science (PCB) -> MBBS (5.5 years including internship) -> MD / MS Specialization',
    600000.00
),
(
    'Biotechnology Researcher',
    (SELECT id FROM domains WHERE name = 'Healthcare and Life Sciences'),
    '12th Science (PCB/PCM) -> B.Sc / B.Tech in Biotechnology -> M.Sc / M.Tech -> Ph.D.',
    500000.00
),
(
    'Chartered Accountant (CA)',
    (SELECT id FROM domains WHERE name = 'Business and Finance'),
    '12th Any Stream -> CA Foundation -> CA Intermediate + 2 Yrs Articleship -> CA Final',
    200000.00
),
(
    'Investment Banker',
    (SELECT id FROM domains WHERE name = 'Business and Finance'),
    '12th Any Stream -> BBA / B.Com / B.Tech -> MBA in Finance / CFA Charter',
    2200000.00
),
(
    'UX/UI Designer',
    (SELECT id FROM domains WHERE name = 'Creative and Design'),
    '12th Any Stream -> B.Des in Communication/Interaction Design -> M.Des / Portfolio',
    1200000.00
),
(
    'Educational Policy Specialist',
    (SELECT id FROM domains WHERE name = 'Education and Social Impact'),
    '12th Any Stream -> B.A. in Social Sciences / Education -> M.A. in Education / Public Policy',
    300000.00
),
(
    'Agricultural Scientist',
    (SELECT id FROM domains WHERE name = 'Agriculture and Sustainability'),
    '12th Science (PCB/PCM) -> B.Sc (Hons) Agriculture -> M.Sc in Agronomy / Soil Science -> Ph.D.',
    260000.00
),
(
    'Corporate Lawyer',
    (SELECT id FROM domains WHERE name = 'Public Service and Law'),
    '12th Any Stream -> 5-Year Integrated B.A. LL.B. (Hons) -> LL.M. in Corporate Law',
    1200000.00
)
ON CONFLICT (name) DO UPDATE SET
    domain_id = EXCLUDED.domain_id,
    education_path = EXCLUDED.education_path,
    avg_course_cost = EXCLUDED.avg_course_cost;

-- =============================================================================
-- 3. COURSES SEED (Idempotent via WHERE NOT EXISTS)
-- =============================================================================
INSERT INTO courses (career_id, name, duration_years, total_cost)
SELECT c.id, val.name, val.duration_years, val.total_cost
FROM (VALUES
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 4.0, 800000.00),
    ('Software Engineer', 'M.Tech in Computer Science', 2.0, 300000.00),
    ('Data Scientist', 'BS in Data Science & Applications', 4.0, 350000.00),
    ('Data Scientist', 'M.Sc in Data Science & Analytics', 2.0, 400000.00),
    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 4.0, 750000.00),
    ('Mechanical Engineer', 'M.Tech in Mechanical Design', 2.0, 250000.00),
    ('Robotics Engineer', 'B.Tech in Mechatronics Engineering', 4.0, 900000.00),
    ('Robotics Engineer', 'M.Tech in Robotics & Automation', 2.0, 350000.00),
    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 5.5, 600000.00),
    ('Medical Doctor (MBBS)', 'Doctor of Medicine (MD)', 3.0, 400000.00),
    ('Biotechnology Researcher', 'B.Tech in Biotechnology', 4.0, 500000.00),
    ('Biotechnology Researcher', 'M.Sc in Biotechnology', 2.0, 200000.00),
    ('Chartered Accountant (CA)', 'CA Foundation & Intermediate Course', 2.0, 80000.00),
    ('Chartered Accountant (CA)', 'CA Final Certification', 2.5, 120000.00),
    ('Investment Banker', 'Bachelor of Business Administration (BBA Finance)', 3.0, 600000.00),
    ('Investment Banker', 'Master of Business Administration (MBA Finance)', 2.0, 2200000.00),
    ('UX/UI Designer', 'Bachelor of Design (B.Des in Interaction Design)', 4.0, 1200000.00),
    ('UX/UI Designer', 'Master of Design (M.Des in User Experience)', 2.0, 600000.00),
    ('Educational Policy Specialist', 'B.A. in Social Sciences & Education', 3.0, 90000.00),
    ('Educational Policy Specialist', 'M.A. in Public Policy & Education', 2.0, 210000.00),
    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 4.0, 160000.00),
    ('Agricultural Scientist', 'M.Sc in Agronomy & Soil Science', 2.0, 100000.00),
    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 5.0, 1200000.00),
    ('Corporate Lawyer', 'LL.M. in Corporate & Financial Law', 1.0, 200000.00)
) AS val(career_name, name, duration_years, total_cost)
JOIN careers c ON c.name = val.career_name
WHERE NOT EXISTS (
    SELECT 1 FROM courses co WHERE co.career_id = c.id AND co.name = val.name
);

-- =============================================================================
-- 4. EXAMS & COLLEGES SEED
-- =============================================================================
INSERT INTO exams_colleges (career_id, exam, college, annual_fee, rank)
SELECT c.id, val.exam, val.college, val.annual_fee, val.rank
FROM (VALUES
    -- Software Engineer
    ('Software Engineer', 'JEE Advanced', 'Indian Institute of Technology (IIT) Bombay', 220000.00, 1),
    ('Software Engineer', 'JEE Main', 'National Institute of Technology (NIT) Trichy', 175000.00, 9),
    ('Software Engineer', 'BITSAT', 'BITS Pilani', 550000.00, 25),
    ('Software Engineer', 'JEE Main', 'International Institute of Information Technology (IIIT) Hyderabad', 400000.00, 55),

    -- Data Scientist
    ('Data Scientist', 'IITM BS Qualifier Exam', 'Indian Institute of Technology (IIT) Madras', 80000.00, 1),
    ('Data Scientist', 'ISI Admission Test', 'Indian Statistical Institute (ISI) Kolkata', NULL, NULL), -- verify
    ('Data Scientist', 'CMI Entrance Exam', 'Chennai Mathematical Institute (CMI)', 200000.00, NULL), -- verify

    -- Mechanical Engineer
    ('Mechanical Engineer', 'JEE Advanced', 'Indian Institute of Technology (IIT) Kanpur', 220000.00, 4),
    ('Mechanical Engineer', 'MHT CET', 'College of Engineering Pune (COEP)', 100000.00, NULL), -- verify
    ('Mechanical Engineer', 'JEE Main', 'National Institute of Technology (NIT) Surathkal', 175000.00, 12),

    -- Robotics Engineer
    ('Robotics Engineer', 'GATE', 'Indian Institute of Technology (IIT) Delhi', 220000.00, 2),
    ('Robotics Engineer', 'MET', 'Manipal Institute of Technology', 450000.00, NULL), -- verify
    ('Robotics Engineer', 'SRMJEEE', 'SRM Institute of Science and Technology', 350000.00, NULL), -- verify

    -- Medical Doctor (MBBS)
    ('Medical Doctor (MBBS)', 'NEET UG', 'All India Institute of Medical Sciences (AIIMS) New Delhi', 1628.00, 1),
    ('Medical Doctor (MBBS)', 'NEET UG', 'Christian Medical College (CMC) Vellore', 60000.00, 3),
    ('Medical Doctor (MBBS)', 'NEET UG', 'King George''s Medical University (KGMU) Lucknow', 54000.00, 7),

    -- Biotechnology Researcher
    ('Biotechnology Researcher', 'GAT-B', 'Jawaharlal Nehru University (JNU) New Delhi', NULL, 10), -- verify
    ('Biotechnology Researcher', 'IIT JAM', 'Indian Institute of Science (IISc) Bengaluru', 45000.00, NULL), -- verify
    ('Biotechnology Researcher', 'CUET PG', 'University of Delhi (DU)', 15000.00, NULL), -- verify

    -- Chartered Accountant (CA)
    ('Chartered Accountant (CA)', 'CA Foundation / Intermediate', 'Institute of Chartered Accountants of India (ICAI) Delhi', 75000.00, NULL), -- verify
    ('Chartered Accountant (CA)', 'CUET UG', 'Shri Ram College of Commerce (SRCC) Delhi', 30000.00, 1),
    ('Chartered Accountant (CA)', 'Merit / CUET', 'Loyola College Chennai', 45000.00, NULL), -- verify

    -- Investment Banker
    ('Investment Banker', 'CAT', 'Indian Institute of Management (IIM) Ahmedabad', 1200000.00, 1),
    ('Investment Banker', 'CAT', 'Indian Institute of Management (IIM) Bangalore', 1225000.00, 2),
    ('Investment Banker', 'CUET UG', 'Shaheed Sukhdev College of Business Studies (SSCBS) Delhi', 25000.00, NULL), -- verify

    -- UX/UI Designer
    ('UX/UI Designer', 'NID DAT', 'National Institute of Design (NID) Ahmedabad', 350000.00, 1),
    ('UX/UI Designer', 'CEED', 'IDC School of Design, IIT Bombay', 220000.00, 2),
    ('UX/UI Designer', 'NIFT Entrance Exam', 'National Institute of Fashion Technology (NIFT) Delhi', 300000.00, NULL), -- verify

    -- Educational Policy Specialist
    ('Educational Policy Specialist', 'CUET PG', 'Tata Institute of Social Sciences (TISS) Mumbai', 65000.00, NULL), -- verify
    ('Educational Policy Specialist', 'APU NET', 'Azim Premji University Bengaluru', 150000.00, NULL), -- verify
    ('Educational Policy Specialist', 'CUET PG', 'Central Institute of Education, Delhi University', 12000.00, NULL), -- verify

    -- Agricultural Scientist
    ('Agricultural Scientist', 'ICAR AIEEA', 'Indian Agricultural Research Institute (IARI) New Delhi', 40000.00, 1),
    ('Agricultural Scientist', 'PAU MET', 'Punjab Agricultural University (PAU) Ludhiana', 80000.00, 2),
    ('Agricultural Scientist', 'ICAR AIEEA / TNAU Entrance', 'Tamil Nadu Agricultural University (TNAU) Coimbatore', 50000.00, NULL), -- verify

    -- Corporate Lawyer
    ('Corporate Lawyer', 'CLAT UG', 'National Law School of India University (NLSIU) Bengaluru', 320000.00, 1),
    ('Corporate Lawyer', 'CLAT UG', 'NALSAR University of Law Hyderabad', 280000.00, 2),
    ('Corporate Lawyer', 'AILET', 'National Law University (NLU) Delhi', 300000.00, NULL) -- verify
) AS val(career_name, exam, college, annual_fee, rank)
JOIN careers c ON c.name = val.career_name
ON CONFLICT (career_id, college, exam) DO UPDATE SET
    annual_fee = EXCLUDED.annual_fee,
    rank = EXCLUDED.rank;


-- =============================================================================
-- 5. VERIFICATION QUERY BLOCK
-- =============================================================================

-- Query 1: Total count of domains (Expect: >= 8)
SELECT COUNT(*) AS total_domains FROM domains;

-- Query 2: Total count of careers (Expect: 10 - 15)
SELECT COUNT(*) AS total_careers FROM careers;

-- Query 3: Verify every domain has at least 1 career
SELECT d.name AS domain_name, COUNT(c.id) AS career_count
FROM domains d
LEFT JOIN careers c ON d.id = c.domain_id
GROUP BY d.name
ORDER BY d.name;

-- Query 4: Verify every career has >= 3 rows in exams_colleges
SELECT 
    c.name AS career_name,
    d.name AS domain_name,
    COUNT(ec.id) AS exams_colleges_count,
    CASE WHEN COUNT(ec.id) >= 3 THEN 'PASS' ELSE 'FAIL' END AS check_status
FROM careers c
JOIN domains d ON c.domain_id = d.id
LEFT JOIN exams_colleges ec ON c.id = ec.career_id
GROUP BY c.id, c.name, d.name
ORDER BY c.name;
