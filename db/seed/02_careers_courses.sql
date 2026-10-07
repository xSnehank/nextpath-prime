-- =============================================================================
-- Seed 02: domains, careers, courses, and the exam + college routes into each course.
--
-- The 8 domains and their ids match backend/app/mocks/domains.json and the frontend.
-- The fees and ranks come from Joel's first draft and have not been checked yet, so every one of those rows
-- is marked estimated = true with source 'Unverified draft' (fix/db-verify-college-data checks them against
-- official pages). The NDA route is sourced from UPSC's official notice.
-- Re-running updates every row (ON CONFLICT ... DO UPDATE).
-- =============================================================================

-- ---------- domains ----------
INSERT INTO domains (id, name, description) VALUES
    ('d0000000-0000-4000-8000-000000000001', 'Engineering / Technology', 'Software, data, electronics and core engineering.'),
    ('d0000000-0000-4000-8000-000000000002', 'Sciences / Research', 'Pure and applied sciences, research and biotechnology.'),
    ('d0000000-0000-4000-8000-000000000003', 'Business / Management', 'Commerce, finance, management and entrepreneurship.'),
    ('d0000000-0000-4000-8000-000000000004', 'Medicine / Healthcare', 'Medicine, nursing, pharmacy and allied health.'),
    ('d0000000-0000-4000-8000-000000000005', 'Arts / Design / Media', 'Design, architecture, fine arts and media.'),
    ('d0000000-0000-4000-8000-000000000006', 'Law / Civil Services', 'Law, public policy and government services.'),
    ('d0000000-0000-4000-8000-000000000007', 'Education / Teaching', 'Teaching, training and educational research.'),
    ('d0000000-0000-4000-8000-000000000008', 'Defence / Sports', 'Armed forces, sports and physical education.')
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

-- ---------- careers ----------
-- trait_weights stay empty until feat/db-career-trait-weights.
INSERT INTO careers (id, name, domain_id, education_path) VALUES
    ('c1000000-0000-4000-8000-000000000001', 'Software Engineer', 'd0000000-0000-4000-8000-000000000001',
     '12th Science (PCM) -> B.Tech in CSE / IT -> Optional M.Tech or MS'),
    ('c1000000-0000-4000-8000-000000000002', 'Data Scientist', 'd0000000-0000-4000-8000-000000000001',
     '12th Science/Commerce with Math -> B.Sc / BS in Data Science or B.Tech -> M.Sc in Data Science / AI'),
    ('c1000000-0000-4000-8000-000000000003', 'Mechanical Engineer', 'd0000000-0000-4000-8000-000000000001',
     '12th Science (PCM) -> B.Tech in Mechanical Engineering -> Optional M.Tech in Design/Thermal'),
    ('c1000000-0000-4000-8000-000000000004', 'Robotics Engineer', 'd0000000-0000-4000-8000-000000000001',
     '12th Science (PCM) -> B.Tech in Mechatronics/Robotics -> M.Tech in Robotics & Automation'),
    ('c1000000-0000-4000-8000-000000000005', 'Medical Doctor (MBBS)', 'd0000000-0000-4000-8000-000000000004',
     '12th Science (PCB) -> MBBS (5.5 years including internship) -> MD / MS Specialization'),
    ('c1000000-0000-4000-8000-000000000006', 'Biotechnology Researcher', 'd0000000-0000-4000-8000-000000000002',
     '12th Science (PCB/PCM) -> B.Sc / B.Tech in Biotechnology -> M.Sc / M.Tech -> Ph.D.'),
    ('c1000000-0000-4000-8000-000000000007', 'Chartered Accountant (CA)', 'd0000000-0000-4000-8000-000000000003',
     '12th Any Stream -> CA Foundation -> CA Intermediate + 2 Yrs Articleship -> CA Final'),
    ('c1000000-0000-4000-8000-000000000008', 'Investment Banker', 'd0000000-0000-4000-8000-000000000003',
     '12th Any Stream -> BBA / B.Com / B.Tech -> MBA in Finance / CFA Charter'),
    ('c1000000-0000-4000-8000-000000000009', 'UX/UI Designer', 'd0000000-0000-4000-8000-000000000005',
     '12th Any Stream -> B.Des in Communication/Interaction Design -> M.Des / Portfolio'),
    ('c1000000-0000-4000-8000-000000000010', 'Educational Policy Specialist', 'd0000000-0000-4000-8000-000000000007',
     '12th Any Stream -> B.A. in Social Sciences / Education -> M.A. in Education / Public Policy'),
    ('c1000000-0000-4000-8000-000000000011', 'Agricultural Scientist', 'd0000000-0000-4000-8000-000000000002',
     '12th Science (PCB/PCM) -> B.Sc (Hons) Agriculture -> M.Sc in Agronomy / Soil Science -> Ph.D.'),
    ('c1000000-0000-4000-8000-000000000012', 'Corporate Lawyer', 'd0000000-0000-4000-8000-000000000006',
     '12th Any Stream -> 5-Year Integrated B.A. LL.B. (Hons) -> LL.M. in Corporate Law'),
    ('c1000000-0000-4000-8000-000000000013', 'Armed Forces Officer (NDA)', 'd0000000-0000-4000-8000-000000000008',
     '12th (Physics and Maths for the Air Force and Navy wings) -> UPSC NDA & NA exam + SSB interview -> '
     '3 years at NDA (JNU degree) -> 1 year at IMA or the Naval Academy -> commissioned officer')
ON CONFLICT (id) DO UPDATE SET
    name           = EXCLUDED.name,
    domain_id      = EXCLUDED.domain_id,
    education_path = EXCLUDED.education_path;

-- ---------- courses ----------
-- UG starts after Class 12; PG needs a first degree. The finance check costs the UG routes.
INSERT INTO courses (career_id, name, level, duration_years)
SELECT c.id, v.course, v.level, v.duration_years
FROM (VALUES
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'UG', 4.0),
    ('Software Engineer', 'M.Tech in Computer Science', 'PG', 2.0),
    ('Data Scientist', 'BS in Data Science & Applications', 'UG', 4.0),
    ('Data Scientist', 'B.Stat (Hons)', 'UG', 3.0),
    ('Data Scientist', 'B.Sc (Hons) Mathematics and Computer Science', 'UG', 3.0),
    ('Data Scientist', 'M.Sc in Data Science & Analytics', 'PG', 2.0),
    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 'UG', 4.0),
    ('Mechanical Engineer', 'M.Tech in Mechanical Design', 'PG', 2.0),
    ('Robotics Engineer', 'B.Tech in Mechatronics Engineering', 'UG', 4.0),
    ('Robotics Engineer', 'M.Tech in Robotics & Automation', 'PG', 2.0),
    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 'UG', 5.5),
    ('Medical Doctor (MBBS)', 'Doctor of Medicine (MD)', 'PG', 3.0),
    ('Biotechnology Researcher', 'B.Tech in Biotechnology', 'UG', 4.0),
    ('Biotechnology Researcher', 'M.Sc in Biotechnology', 'PG', 2.0),
    -- Joel's two CA stages (2 + 2.5 years) as one programme: it starts right after Class 12.
    ('Chartered Accountant (CA)', 'Chartered Accountancy (Foundation, Intermediate, articleship, Final)', 'UG', 4.5),
    ('Chartered Accountant (CA)', 'B.Com (Hons)', 'UG', 3.0),  -- the degree many CA students take alongside
    ('Investment Banker', 'Bachelor of Business Administration (BBA Finance)', 'UG', 3.0),
    ('Investment Banker', 'Master of Business Administration (MBA Finance)', 'PG', 2.0),
    ('UX/UI Designer', 'Bachelor of Design (B.Des in Interaction Design)', 'UG', 4.0),
    ('UX/UI Designer', 'Master of Design (M.Des in User Experience)', 'PG', 2.0),
    ('Educational Policy Specialist', 'B.A. in Social Sciences & Education', 'UG', 3.0),
    ('Educational Policy Specialist', 'M.A. in Public Policy & Education', 'PG', 2.0),
    ('Educational Policy Specialist', 'B.A. (Hons), four-year', 'UG', 4.0),
    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 'UG', 4.0),
    ('Agricultural Scientist', 'M.Sc in Agronomy & Soil Science', 'PG', 2.0),
    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 'UG', 5.0),
    ('Corporate Lawyer', 'LL.M. in Corporate & Financial Law', 'PG', 1.0),
    -- UPSC notice: 3 years at NDA, then 1 year at IMA (Army) or the Indian Naval Academy (Navy).
    ('Armed Forces Officer (NDA)', 'NDA training (3 years) and service academy (1 year)', 'UG', 4.0)
) AS v(career, course, level, duration_years)
JOIN careers c ON c.name = v.career
ON CONFLICT (career_id, name) DO UPDATE SET
    level          = EXCLUDED.level,
    duration_years = EXCLUDED.duration_years;

-- ---------- exam + college routes: Joel's draft, not yet checked ----------
INSERT INTO exams_colleges (course_id, exam, college, city, state, annual_fee, rank, rank_source, source, estimated)
SELECT co.id, v.exam, v.college, v.city, v.state, v.annual_fee, v.rank,
       CASE WHEN v.rank IS NOT NULL THEN 'Unverified draft' END, 'Unverified draft', true
FROM (VALUES
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'JEE Advanced',
     'Indian Institute of Technology (IIT) Bombay', 'Mumbai', 'Maharashtra', 220000, 1),
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'JEE Main',
     'National Institute of Technology (NIT) Trichy', 'Tiruchirappalli', 'Tamil Nadu', 175000, 9),
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'BITSAT',
     'BITS Pilani', 'Pilani', 'Rajasthan', 550000, 25),
    ('Software Engineer', 'B.Tech in Computer Science & Engineering', 'JEE Main',
     'International Institute of Information Technology (IIIT) Hyderabad', 'Hyderabad', 'Telangana', 400000, 55),

    ('Data Scientist', 'BS in Data Science & Applications', 'IITM BS Qualifier Exam',
     'Indian Institute of Technology (IIT) Madras', 'Chennai', 'Tamil Nadu', 80000, 1),
    ('Data Scientist', 'B.Stat (Hons)', 'ISI Admission Test',
     'Indian Statistical Institute (ISI) Kolkata', 'Kolkata', 'West Bengal', NULL, NULL),
    ('Data Scientist', 'B.Sc (Hons) Mathematics and Computer Science', 'CMI Entrance Exam',
     'Chennai Mathematical Institute (CMI)', 'Chennai', 'Tamil Nadu', 200000, NULL),

    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 'JEE Advanced',
     'Indian Institute of Technology (IIT) Kanpur', 'Kanpur', 'Uttar Pradesh', 220000, 4),
    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 'MHT CET',
     'College of Engineering Pune (COEP)', 'Pune', 'Maharashtra', 100000, NULL),
    ('Mechanical Engineer', 'B.Tech in Mechanical Engineering', 'JEE Main',
     'National Institute of Technology (NIT) Surathkal', 'Mangaluru', 'Karnataka', 175000, 12),

    ('Robotics Engineer', 'M.Tech in Robotics & Automation', 'GATE',
     'Indian Institute of Technology (IIT) Delhi', 'New Delhi', 'Delhi', 220000, 2),
    ('Robotics Engineer', 'B.Tech in Mechatronics Engineering', 'MET',
     'Manipal Institute of Technology', 'Manipal', 'Karnataka', 450000, NULL),
    ('Robotics Engineer', 'B.Tech in Mechatronics Engineering', 'SRMJEEE',
     'SRM Institute of Science and Technology', 'Chennai', 'Tamil Nadu', 350000, NULL),

    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 'NEET UG',
     'All India Institute of Medical Sciences (AIIMS) New Delhi', 'New Delhi', 'Delhi', 1628, 1),
    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 'NEET UG',
     'Christian Medical College (CMC) Vellore', 'Vellore', 'Tamil Nadu', 60000, 3),
    ('Medical Doctor (MBBS)', 'Bachelor of Medicine and Bachelor of Surgery (MBBS)', 'NEET UG',
     'King George''s Medical University (KGMU) Lucknow', 'Lucknow', 'Uttar Pradesh', 54000, 7),

    ('Biotechnology Researcher', 'M.Sc in Biotechnology', 'GAT-B',
     'Jawaharlal Nehru University (JNU) New Delhi', 'New Delhi', 'Delhi', NULL, 10),
    ('Biotechnology Researcher', 'M.Sc in Biotechnology', 'IIT JAM',
     'Indian Institute of Science (IISc) Bengaluru', 'Bengaluru', 'Karnataka', 45000, NULL),
    ('Biotechnology Researcher', 'M.Sc in Biotechnology', 'CUET PG',
     'University of Delhi (DU)', 'New Delhi', 'Delhi', 15000, NULL),

    ('Chartered Accountant (CA)', 'Chartered Accountancy (Foundation, Intermediate, articleship, Final)',
     'CA Foundation / Intermediate', 'Institute of Chartered Accountants of India (ICAI) Delhi', 'New Delhi', 'Delhi',
     75000, NULL),
    ('Chartered Accountant (CA)', 'B.Com (Hons)', 'CUET UG',
     'Shri Ram College of Commerce (SRCC) Delhi', 'New Delhi', 'Delhi', 30000, 1),
    ('Chartered Accountant (CA)', 'B.Com (Hons)', 'Merit / CUET',
     'Loyola College Chennai', 'Chennai', 'Tamil Nadu', 45000, NULL),

    ('Investment Banker', 'Master of Business Administration (MBA Finance)', 'CAT',
     'Indian Institute of Management (IIM) Ahmedabad', 'Ahmedabad', 'Gujarat', 1200000, 1),
    ('Investment Banker', 'Master of Business Administration (MBA Finance)', 'CAT',
     'Indian Institute of Management (IIM) Bangalore', 'Bengaluru', 'Karnataka', 1225000, 2),
    ('Investment Banker', 'Bachelor of Business Administration (BBA Finance)', 'CUET UG',
     'Shaheed Sukhdev College of Business Studies (SSCBS) Delhi', 'New Delhi', 'Delhi', 25000, NULL),

    ('UX/UI Designer', 'Bachelor of Design (B.Des in Interaction Design)', 'NID DAT',
     'National Institute of Design (NID) Ahmedabad', 'Ahmedabad', 'Gujarat', 350000, 1),
    ('UX/UI Designer', 'Master of Design (M.Des in User Experience)', 'CEED',
     'IDC School of Design, IIT Bombay', 'Mumbai', 'Maharashtra', 220000, 2),
    ('UX/UI Designer', 'Bachelor of Design (B.Des in Interaction Design)', 'NIFT Entrance Exam',
     'National Institute of Fashion Technology (NIFT) Delhi', 'New Delhi', 'Delhi', 300000, NULL),

    ('Educational Policy Specialist', 'M.A. in Public Policy & Education', 'CUET PG',
     'Tata Institute of Social Sciences (TISS) Mumbai', 'Mumbai', 'Maharashtra', 65000, NULL),
    ('Educational Policy Specialist', 'M.A. in Public Policy & Education', 'APU NET',
     'Azim Premji University Bengaluru', 'Bengaluru', 'Karnataka', 150000, NULL),
    ('Educational Policy Specialist', 'M.A. in Public Policy & Education', 'CUET PG',
     'Central Institute of Education, Delhi University', 'New Delhi', 'Delhi', 12000, NULL),

    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 'ICAR AIEEA',
     'Indian Agricultural Research Institute (IARI) New Delhi', 'New Delhi', 'Delhi', 40000, 1),
    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 'PAU MET',
     'Punjab Agricultural University (PAU) Ludhiana', 'Ludhiana', 'Punjab', 80000, 2),
    ('Agricultural Scientist', 'B.Sc (Hons) Agriculture', 'ICAR AIEEA / TNAU Entrance',
     'Tamil Nadu Agricultural University (TNAU) Coimbatore', 'Coimbatore', 'Tamil Nadu', 50000, NULL),

    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 'CLAT UG',
     'National Law School of India University (NLSIU) Bengaluru', 'Bengaluru', 'Karnataka', 320000, 1),
    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 'CLAT UG',
     'NALSAR University of Law Hyderabad', 'Hyderabad', 'Telangana', 280000, 2),
    ('Corporate Lawyer', 'Integrated B.A. LL.B. (Honours)', 'AILET',
     'National Law University (NLU) Delhi', 'New Delhi', 'Delhi', 300000, NULL)
) AS v(career, course, exam, college, city, state, annual_fee, rank)
JOIN careers c ON c.name = v.career
JOIN courses co ON co.career_id = c.id AND co.name = v.course
ON CONFLICT (course_id, college, exam) DO UPDATE SET
    city        = EXCLUDED.city,
    state       = EXCLUDED.state,
    annual_fee  = EXCLUDED.annual_fee,
    rank        = EXCLUDED.rank,
    rank_source = EXCLUDED.rank_source,
    source      = EXCLUDED.source,
    estimated   = EXCLUDED.estimated;

-- ---------- exam + college routes: from secondary sources, not yet checked against the official page ----------
-- Each career needs at least one undergraduate route the solver can cost; these two fill the gaps.
INSERT INTO exams_colleges
    (course_id, exam, college, city, state, annual_fee, annual_living_cost, source, source_url, as_of, estimated)
SELECT co.id, v.exam, v.college, v.city, v.state, v.annual_fee, v.living, v.source, v.url, CAST(v.as_of AS date), true
FROM (VALUES
    ('Biotechnology Researcher', 'B.Tech in Biotechnology', 'JEE Advanced',
     'Indian Institute of Technology (IIT) Madras (B.Tech Biological Engineering)', 'Chennai', 'Tamil Nadu',
     230804, NULL,
     'IIT Madras fee circular for 2026 admission: semester fee Rs 1,15,402 x 2 (General/OBC-NCL/EWS, family income above Rs 5 lakh; figures from Cracku''s summary, not yet checked against the PDF)',
     'https://fees.iitm.ac.in/assets/circular/fees_structure_2026_admission_ug_pg.pdf', '2026-10-07'),
    ('Educational Policy Specialist', 'B.A. (Hons), four-year', 'Azim Premji University National Entrance Test',
     'Azim Premji University Bengaluru', 'Bengaluru', 'Karnataka', 332500, 80000,
     'Careers360, Azim Premji University fees: B.A. (Hons) Rs 13.30 lakh for 4 years; accommodation Rs 80,000 a year',
     'https://www.careers360.com/university/azim-premji-university-bangalore/fees', '2026-10-07')
) AS v(career, course, exam, college, city, state, annual_fee, living, source, url, as_of)
JOIN careers c ON c.name = v.career
JOIN courses co ON co.career_id = c.id AND co.name = v.course
ON CONFLICT (course_id, college, exam) DO UPDATE SET
    city = EXCLUDED.city, state = EXCLUDED.state, annual_fee = EXCLUDED.annual_fee,
    annual_living_cost = EXCLUDED.annual_living_cost, source = EXCLUDED.source, source_url = EXCLUDED.source_url,
    as_of = EXCLUDED.as_of, estimated = EXCLUDED.estimated;

-- ---------- exam + college routes: sourced ----------
-- UPSC, NDA & NA Examination (II) 2026 notice (20 May 2026): training, accommodation, books, uniforms,
-- boarding and medical treatment are paid by the Government; families meet pocket expenses, "not likely to
-- exceed Rs. 3000 per month" (stored as 12 x 3000 = 36000 a year).
INSERT INTO exams_colleges
    (course_id, exam, college, city, state, annual_fee, annual_living_cost, source, source_url, as_of, estimated)
SELECT co.id, 'UPSC NDA & NA Examination + SSB interview', 'National Defence Academy, Khadakwasla', 'Pune',
       'Maharashtra', 0, 36000, 'UPSC NDA & NA Examination (II) 2026 notice',
       'https://www.upsc.gov.in/sites/default/files/Notif-NDA-II-2026-Engl-200526.pdf', DATE '2026-05-20', false
FROM courses co
JOIN careers c ON c.id = co.career_id
WHERE c.name = 'Armed Forces Officer (NDA)'
  AND co.name = 'NDA training (3 years) and service academy (1 year)'
ON CONFLICT (course_id, college, exam) DO UPDATE SET
    city               = EXCLUDED.city,
    state              = EXCLUDED.state,
    annual_fee         = EXCLUDED.annual_fee,
    annual_living_cost = EXCLUDED.annual_living_cost,
    source             = EXCLUDED.source,
    source_url         = EXCLUDED.source_url,
    as_of              = EXCLUDED.as_of,
    estimated          = EXCLUDED.estimated;
