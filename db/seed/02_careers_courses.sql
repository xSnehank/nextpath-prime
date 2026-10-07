-- =============================================================================
-- PRISM Engine Seed Script: 02_careers_courses.sql
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Description:
-- Idempotent seed for Domains, Careers (with trait_weights), Courses, and Exams & Colleges.
-- Covers 8 domains, 12 careers, 24 courses, and 37 undergraduate exam/college pairings
-- complete with course_id linkages, NIRF ranks, annual fees, and source attributions.
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
-- 2. CAREERS SEED (With trait_weights for scoring engine)
-- =============================================================================
INSERT INTO careers (name, domain_id, education_path, avg_course_cost, trait_weights) VALUES
(
    'Software Engineer',
    (SELECT id FROM domains WHERE name = 'Technology and AI'),
    '12th Science (PCM) -> B.Tech in CSE / IT -> Optional M.Tech or MS',
    800000.00,
    '{
        "aptitude": {"logical": 0.40, "numerical": 0.30, "verbal": 0.10, "spatial": 0.10, "creative": 0.10},
        "interest": {"realistic": 0.10, "investigative": 0.40, "artistic": 0.10, "social": 0.10, "enterprising": 0.10, "conventional": 0.20},
        "cognitive": {"analytical": 0.60, "structured": 0.40}
    }'::jsonb
),
(
    'Data Scientist',
    (SELECT id FROM domains WHERE name = 'Technology and AI'),
    '12th Science/Commerce with Math -> B.Sc / BS in Data Science or B.Tech -> M.Sc in Data Science / AI',
    650000.00,
    '{
        "aptitude": {"logical": 0.35, "numerical": 0.45, "verbal": 0.10, "spatial": 0.05, "creative": 0.05},
        "interest": {"realistic": 0.05, "investigative": 0.55, "artistic": 0.05, "social": 0.05, "enterprising": 0.10, "conventional": 0.20},
        "cognitive": {"analytical": 0.70, "structured": 0.30}
    }'::jsonb
),
(
    'Mechanical Engineer',
    (SELECT id FROM domains WHERE name = 'Engineering and Manufacturing'),
    '12th Science (PCM) -> B.Tech in Mechanical Engineering -> Optional M.Tech in Design/Thermal',
    750000.00,
    '{
        "aptitude": {"logical": 0.25, "numerical": 0.30, "verbal": 0.05, "spatial": 0.35, "creative": 0.05},
        "interest": {"realistic": 0.50, "investigative": 0.25, "artistic": 0.05, "social": 0.05, "enterprising": 0.05, "conventional": 0.10},
        "cognitive": {"analytical": 0.50, "structured": 0.50}
    }'::jsonb
),
(
    'Robotics Engineer',
    (SELECT id FROM domains WHERE name = 'Engineering and Manufacturing'),
    '12th Science (PCM) -> B.Tech in Mechatronics/Robotics -> M.Tech in Robotics & Automation',
    900000.00,
    '{
        "aptitude": {"logical": 0.35, "numerical": 0.25, "verbal": 0.05, "spatial": 0.25, "creative": 0.10},
        "interest": {"realistic": 0.40, "investigative": 0.35, "artistic": 0.05, "social": 0.05, "enterprising": 0.05, "conventional": 0.10},
        "cognitive": {"analytical": 0.60, "structured": 0.40}
    }'::jsonb
),
(
    'Medical Doctor (MBBS)',
    (SELECT id FROM domains WHERE name = 'Healthcare and Life Sciences'),
    '12th Science (PCB) -> MBBS (5.5 years including internship) -> MD / MS Specialization',
    600000.00,
    '{
        "aptitude": {"logical": 0.30, "numerical": 0.20, "verbal": 0.30, "spatial": 0.10, "creative": 0.10},
        "interest": {"realistic": 0.10, "investigative": 0.40, "artistic": 0.05, "social": 0.35, "enterprising": 0.05, "conventional": 0.05},
        "cognitive": {"analytical": 0.50, "structured": 0.50}
    }'::jsonb
),
(
    'Biotechnology Researcher',
    (SELECT id FROM domains WHERE name = 'Healthcare and Life Sciences'),
    '12th Science (PCB/PCM) -> B.Sc / B.Tech in Biotechnology -> M.Sc / M.Tech -> Ph.D.',
    500000.00,
    '{
        "aptitude": {"logical": 0.30, "numerical": 0.30, "verbal": 0.20, "spatial": 0.10, "creative": 0.10},
        "interest": {"realistic": 0.10, "investigative": 0.60, "artistic": 0.05, "social": 0.10, "enterprising": 0.05, "conventional": 0.10},
        "cognitive": {"analytical": 0.60, "structured": 0.40}
    }'::jsonb
),
(
    'Chartered Accountant (CA)',
    (SELECT id FROM domains WHERE name = 'Business and Finance'),
    '12th Any Stream -> CA Foundation -> CA Intermediate + 2 Yrs Articleship -> CA Final',
    200000.00,
    '{
        "aptitude": {"logical": 0.30, "numerical": 0.50, "verbal": 0.10, "spatial": 0.05, "creative": 0.05},
        "interest": {"realistic": 0.05, "investigative": 0.20, "artistic": 0.05, "social": 0.05, "enterprising": 0.25, "conventional": 0.40},
        "cognitive": {"analytical": 0.50, "structured": 0.50}
    }'::jsonb
),
(
    'Investment Banker',
    (SELECT id FROM domains WHERE name = 'Business and Finance'),
    '12th Any Stream -> BBA / B.Com / B.Tech -> MBA in Finance / CFA Charter',
    2200000.00,
    '{
        "aptitude": {"logical": 0.35, "numerical": 0.40, "verbal": 0.15, "spatial": 0.05, "creative": 0.05},
        "interest": {"realistic": 0.05, "investigative": 0.20, "artistic": 0.05, "social": 0.10, "enterprising": 0.45, "conventional": 0.15},
        "cognitive": {"analytical": 0.60, "structured": 0.40}
    }'::jsonb
),
(
    'UX/UI Designer',
    (SELECT id FROM domains WHERE name = 'Creative and Design'),
    '12th Any Stream -> B.Des in Communication/Interaction Design -> M.Des / Portfolio',
    1200000.00,
    '{
        "aptitude": {"logical": 0.15, "numerical": 0.05, "verbal": 0.15, "spatial": 0.35, "creative": 0.30},
        "interest": {"realistic": 0.10, "investigative": 0.15, "artistic": 0.55, "social": 0.10, "enterprising": 0.05, "conventional": 0.05},
        "cognitive": {"analytical": 0.30, "structured": 0.70}
    }'::jsonb
),
(
    'Educational Policy Specialist',
    (SELECT id FROM domains WHERE name = 'Education and Social Impact'),
    '12th Any Stream -> B.A. in Social Sciences / Education -> M.A. in Education / Public Policy',
    300000.00,
    '{
        "aptitude": {"logical": 0.25, "numerical": 0.15, "verbal": 0.45, "spatial": 0.05, "creative": 0.10},
        "interest": {"realistic": 0.05, "investigative": 0.25, "artistic": 0.10, "social": 0.40, "enterprising": 0.10, "conventional": 0.10},
        "cognitive": {"analytical": 0.50, "structured": 0.50}
    }'::jsonb
),
(
    'Agricultural Scientist',
    (SELECT id FROM domains WHERE name = 'Agriculture and Sustainability'),
    '12th Science (PCB/PCM) -> B.Sc (Hons) Agriculture -> M.Sc in Agronomy / Soil Science -> Ph.D.',
    260000.00,
    '{
        "aptitude": {"logical": 0.30, "numerical": 0.25, "verbal": 0.15, "spatial": 0.20, "creative": 0.10},
        "interest": {"realistic": 0.35, "investigative": 0.40, "artistic": 0.05, "social": 0.10, "enterprising": 0.05, "conventional": 0.05},
        "cognitive": {"analytical": 0.50, "structured": 0.50}
    }'::jsonb
),
(
    'Corporate Lawyer',
    (SELECT id FROM domains WHERE name = 'Public Service and Law'),
    '12th Any Stream -> 5-Year Integrated B.A. LL.B. (Hons) -> LL.M. in Corporate Law',
    1200000.00,
    '{
        "aptitude": {"logical": 0.35, "numerical": 0.10, "verbal": 0.45, "spatial": 0.05, "creative": 0.05},
        "interest": {"realistic": 0.05, "investigative": 0.25, "artistic": 0.05, "social": 0.15, "enterprising": 0.35, "conventional": 0.15},
        "cognitive": {"analytical": 0.60, "structured": 0.40}
    }'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
    domain_id = EXCLUDED.domain_id,
    education_path = EXCLUDED.education_path,
    avg_course_cost = EXCLUDED.avg_course_cost,
    trait_weights = EXCLUDED.trait_weights;

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
-- 4. EXAMS & COLLEGES SEED (Undergraduate routes with course_id and sources)
-- =============================================================================
INSERT INTO exams_colleges (career_id, course_id, exam, college, annual_fee, rank, source, source_url, as_of)
SELECT 
    c.id, 
    co.id AS course_id, 
    val.exam, 
    val.college, 
    val.annual_fee, 
    val.rank, 
    val.source, 
    val.source_url, 
    val.as_of::DATE
FROM (VALUES
    -- Software Engineer (B.Tech CSE)
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'JEE Advanced', 'Indian Institute of Technology (IIT) Bombay', 220000.00, 1, 'NIRF 2026 Engineering Ranking', 'https://www.nirfindia.org/2026/EngineeringRanking.html', '2026-09-01'),
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'JEE Main', 'National Institute of Technology (NIT) Trichy', 175000.00, 9, 'NIRF 2026 Engineering Ranking', 'https://www.nitt.edu/home/academics/fees/', '2026-09-01'),
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'BITSAT', 'BITS Pilani', 550000.00, 25, 'BITS Pilani Official Fee Structure', 'https://www.bits-pilani.ac.in/admissions/fees', '2026-09-01'),
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'JEE Main', 'International Institute of Information Technology (IIIT) Hyderabad', 400000.00, 55, 'IIIT Hyderabad Academic Portal', 'https://www.iiit.ac.in/admissions/undergraduate/', '2026-09-01'),

    -- Data Scientist (BS Data Science)
    ('Data Scientist', 'BS in Data Science & Applications', 'IITM BS Qualifier Exam', 'Indian Institute of Technology (IIT) Madras', 80000.00, 1, 'IIT Madras Degree Portal', 'https://study.iitm.ac.in/ds/', '2026-09-01'),
    ('Data Scientist', 'BS in Data Science & Applications', 'ISI Admission Test', 'Indian Statistical Institute (ISI) Kolkata', 15000.00, 2, 'ISI Kolkata Academic Prospectus', 'https://www.isical.ac.in/academic-programs', '2026-09-01'),
    ('Data Scientist', 'BS in Data Science & Applications', 'CMI Entrance Exam', 'Chennai Mathematical Institute (CMI)', 200000.00, 5, 'CMI Admissions Portal', 'https://www.cmi.ac.in/admissions/', '2026-09-01'),

    -- Mechanical Engineer (B.Tech Mechanical)
    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 'JEE Advanced', 'Indian Institute of Technology (IIT) Kanpur', 220000.00, 4, 'NIRF 2026 Engineering Ranking', 'https://www.iitk.ac.in/doaa/', '2026-09-01'),
    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 'MHT CET', 'College of Engineering Pune (COEP)', 100000.00, 48, 'COEP Fee Structure 2026', 'https://www.coep.org.in/admissions', '2026-09-01'),
    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 'JEE Main', 'National Institute of Technology (NIT) Surathkal', 175000.00, 12, 'NIRF 2026 Engineering Ranking', 'https://www.nitk.ac.in/admissions', '2026-09-01'),

    -- Robotics Engineer (B.Tech Mechatronics)
    ('Robotics Engineer', 'B.Tech in Mechatronics Engineering', 'JEE Advanced', 'Indian Institute of Technology (IIT) Delhi', 220000.00, 2, 'NIRF 2026 Engineering Ranking', 'https://home.iitd.ac.in/admissions.php', '2026-09-01'),
    ('Robotics Engineer', 'B.Tech in Mechatronics Engineering', 'MET', 'Manipal Institute of Technology', 450000.00, 61, 'MAHE Fee Structure', 'https://manipal.edu/mit/admissions.html', '2026-09-01'),
    ('Robotics Engineer', 'B.Tech in Mechatronics Engineering', 'SRMJEEE', 'SRM Institute of Science and Technology', 350000.00, 28, 'SRMIST Admissions Portal', 'https://www.srmist.edu.in/admission-india/', '2026-09-01'),

    -- Medical Doctor (MBBS)
    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 'NEET UG', 'All India Institute of Medical Sciences (AIIMS) New Delhi', 1628.00, 1, 'NIRF 2026 Medical Ranking', 'https://www.aiims.edu/en/academic_prospectus.html', '2026-09-01'),
    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 'NEET UG', 'Christian Medical College (CMC) Vellore', 60000.00, 3, 'NIRF 2026 Medical Ranking', 'https://www.cmch-vellore.edu/admissions', '2026-09-01'),
    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 'NEET UG', 'King George''s Medical University (KGMU) Lucknow', 54000.00, 7, 'KGMU Official Portal', 'https://www.kgmu.org/academic_fee.php', '2026-09-01'),

    -- Biotechnology Researcher (B.Tech Biotech)
    ('Biotechnology Researcher', 'B.Tech in Biotechnology', 'CUET UG', 'Jawaharlal Nehru University (JNU) New Delhi', 12000.00, 10, 'JNU Academic Prospectus', 'https://www.jnu.ac.in/admissions', '2026-09-01'),
    ('Biotechnology Researcher', 'B.Tech in Biotechnology', 'JEE Advanced', 'Indian Institute of Science (IISc) Bengaluru', 45000.00, 1, 'IISc UG Admissions', 'https://bs-ug.iisc.ac.in/', '2026-09-01'),
    ('Biotechnology Researcher', 'B.Tech in Biotechnology', 'CUET UG', 'University of Delhi (DU)', 15000.00, 11, 'DU Bulletin of Information', 'https://admission.uod.ac.in/', '2026-09-01'),

    -- Chartered Accountant (CA)
    ('Chartered Accountant (CA)', 'CA Foundation & Intermediate Course', 'CA Foundation', 'Institute of Chartered Accountants of India (ICAI) Delhi', 40000.00, 1, 'ICAI Student Portal', 'https://www.icai.org/post/students-fee-structure', '2026-09-01'),
    ('Chartered Accountant (CA)', 'CA Foundation & Intermediate Course', 'CUET UG', 'Shri Ram College of Commerce (SRCC) Delhi', 30000.00, 1, 'NIRF 2026 College Ranking', 'https://www.srcc.edu/admissions', '2026-09-01'),
    ('Chartered Accountant (CA)', 'CA Foundation & Intermediate Course', 'CUET UG', 'Loyola College Chennai', 45000.00, 8, 'NIRF 2026 College Ranking', 'https://www.loyolacollege.edu/admissions', '2026-09-01'),

    -- Investment Banker (BBA / IPM)
    ('Investment Banker', 'Bachelor of Business Administration (BBA Finance)', 'IPMAT', 'Indian Institute of Management (IIM) Indore', 500000.00, 8, 'NIRF 2026 Management Ranking', 'https://www.iimidr.ac.in/academic-programmes/ipm/', '2026-09-01'),
    ('Investment Banker', 'Bachelor of Business Administration (BBA Finance)', 'IPMAT', 'Indian Institute of Management (IIM) Rohtak', 480000.00, 12, 'NIRF 2026 Management Ranking', 'https://www.iimrohtak.ac.in/ipm.aspx', '2026-09-01'),
    ('Investment Banker', 'Bachelor of Business Administration (BBA Finance)', 'CUET UG', 'Shaheed Sukhdev College of Business Studies (SSCBS) Delhi', 25000.00, 15, 'SSCBS Delhi Official Portal', 'https://sscbs.du.ac.in/admissions/', '2026-09-01'),

    -- UX/UI Designer (B.Des)
    ('UX/UI Designer', 'Bachelor of Design (B.Des in Interaction Design)', 'NID DAT', 'National Institute of Design (NID) Ahmedabad', 350000.00, 1, 'NID Admissions Handbook 2026', 'https://admissions.nid.edu/', '2026-09-01'),
    ('UX/UI Designer', 'Bachelor of Design (B.Des in Interaction Design)', 'UCEED', 'IDC School of Design, IIT Bombay', 220000.00, 2, 'UCEED IIT Bombay Portal', 'https://www.uceed.iitb.ac.in/', '2026-09-01'),
    ('UX/UI Designer', 'Bachelor of Design (B.Des in Interaction Design)', 'NIFT Entrance Exam', 'National Institute of Fashion Technology (NIFT) Delhi', 300000.00, 9, 'NIFT Admissions Portal', 'https://nift.ac.in/admissions', '2026-09-01'),

    -- Educational Policy Specialist (B.A. Social Sciences)
    ('Educational Policy Specialist', 'B.A. in Social Sciences & Education', 'CUET UG', 'Tata Institute of Social Sciences (TISS) Mumbai', 65000.00, 15, 'TISS Undergraduate Admissions', 'https://admissions.tiss.edu/', '2026-09-01'),
    ('Educational Policy Specialist', 'B.A. in Social Sciences & Education', 'APU NET', 'Azim Premji University Bengaluru', 150000.00, 20, 'Azim Premji University Admissions', 'https://azimpremjiuniversity.edu.in/undergraduate', '2026-09-01'),
    ('Educational Policy Specialist', 'B.A. in Social Sciences & Education', 'CUET UG', 'Central Institute of Education, Delhi University', 12000.00, 11, 'DU Admissions Portal', 'https://cie.du.ac.in/', '2026-09-01'),

    -- Agricultural Scientist (B.Sc Hons Ag)
    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 'ICAR AIEEA', 'Indian Agricultural Research Institute (IARI) New Delhi', 40000.00, 1, 'ICAR NIRF 2026 Agriculture Ranking', 'https://icar.org.in/aieea-ug', '2026-09-01'),
    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 'PAU MET', 'Punjab Agricultural University (PAU) Ludhiana', 80000.00, 2, 'PAU Academic Prospectus', 'https://www.pau.edu/admissions', '2026-09-01'),
    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 'ICAR AIEEA', 'Tamil Nadu Agricultural University (TNAU) Coimbatore', 50000.00, 5, 'TNAU Admissions Portal', 'https://tnau.ac.in/admissions/', '2026-09-01'),

    -- Corporate Lawyer (B.A. LL.B.)
    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 'CLAT UG', 'National Law School of India University (NLSIU) Bengaluru', 320000.00, 1, 'NIRF 2026 Law Ranking', 'https://www.nls.ac.in/programmes/ba-llb-hons/', '2026-09-01'),
    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 'CLAT UG', 'NALSAR University of Law Hyderabad', 280000.00, 2, 'NIRF 2026 Law Ranking', 'https://www.nalsar.ac.in/admissions', '2026-09-01'),
    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 'AILET', 'National Law University (NLU) Delhi', 300000.00, 3, 'NIRF 2026 Law Ranking', 'https://nludelhi.ac.in/admissions.aspx', '2026-09-01')
) AS val(career_name, course_name, exam, college, annual_fee, rank, source, source_url, as_of)
JOIN careers c ON c.name = val.career_name
JOIN courses co ON co.career_id = c.id AND co.name = val.course_name
ON CONFLICT (career_id, college, exam) DO UPDATE SET
    course_id = EXCLUDED.course_id,
    annual_fee = EXCLUDED.annual_fee,
    rank = EXCLUDED.rank,
    source = EXCLUDED.source,
    source_url = EXCLUDED.source_url,
    as_of = EXCLUDED.as_of;


-- =============================================================================
-- 5. VERIFICATION QUERY BLOCK
-- =============================================================================

-- Query 1: Total count of domains (Expect: >= 8)
SELECT COUNT(*) AS total_domains FROM domains;

-- Query 2: Total count of careers (Expect: 12)
SELECT COUNT(*) AS total_careers FROM careers;

-- Query 3: Verify every domain has at least 1 career
SELECT d.name AS domain_name, COUNT(c.id) AS career_count
FROM domains d
LEFT JOIN careers c ON d.id = c.domain_id
GROUP BY d.name
ORDER BY d.name;

-- Query 4: Verify every career has >= 3 rows in exams_colleges with non-null course_id
SELECT 
    c.name AS career_name,
    d.name AS domain_name,
    COUNT(ec.id) AS exams_colleges_count,
    COUNT(ec.course_id) AS linked_courses_count,
    CASE WHEN COUNT(ec.id) >= 3 AND COUNT(ec.course_id) = COUNT(ec.id) THEN 'PASS' ELSE 'FAIL' END AS check_status
FROM careers c
JOIN domains d ON c.domain_id = d.id
LEFT JOIN exams_colleges ec ON c.id = ec.career_id
GROUP BY c.id, c.name, d.name
ORDER BY c.name;
