-- =============================================================================
-- Seed 04: national market data per career, and the national living cost.
--
-- One 'India' row per career (state-level figures aren't published for these occupations, so the backend
-- uses this national row for every state and flags it 'estimated'). Every row is estimated = true, because
-- demand and growth are SECTOR figures standing in for the occupation. Each row's source names all three:
--   salary  PayScale India, occupation page: entry = the "less than 1 year experience" average total pay,
--           median = the average base salary. as_of is that page's "updated" date.
--   demand  ManpowerGroup Employment Outlook Survey, India, Q4 2026 (published 8 Sep 2026): the sector's Net
--           Employment Outlook. Only Finance & Insurance (60) and Information (57) were published;
--           other careers use the national NEO (54).
--   growth  Naukri JobSpeak, August 2026 (published 7 Sep 2026): year-on-year hiring growth for the sector
--           or role. Sectors it didn't report use the overall white-collar growth (14).
-- The NDA officer's pay is the starting pay in UPSC's NDA & NA (II) 2026 notice: Level 10 basic Rs 56,100 +
-- Military Service Pay Rs 15,500 a month = Rs 8,59,200 a year, before allowances.
-- =============================================================================

INSERT INTO market_data
    (career_id, region, entry_salary, median_salary, demand_index, growth_rate, as_of, source, source_url, estimated)
SELECT c.id, 'India', v.entry_salary, v.median_salary, v.demand, v.growth, CAST(v.as_of AS date), v.source, v.url, true
FROM (VALUES
    ('Software Engineer', 537425, 813748, 57, 11, '2026-07-12',
     'Salary: PayScale India, Software Engineer (4,950 profiles). Demand: ManpowerGroup MEOS India Q4 2026, Information sector. Growth: Naukri JobSpeak Aug 2026, IT/software services.',
     'https://www.payscale.com/research/IN/Job=Software_Engineer/Salary'),
    ('Data Scientist', 595255, 1017652, 57, 31, '2026-07-09',
     'Salary: PayScale India, Data Scientist (1,267 profiles). Demand: ManpowerGroup MEOS India Q4 2026, Information sector. Growth: Naukri JobSpeak Aug 2026, AI/ML roles.',
     'https://www.payscale.com/research/IN/Job=Data_Scientist/Salary'),
    ('Mechanical Engineer', 303575, 516339, 54, 19, '2026-06-13',
     'Salary: PayScale India, Mechanical Engineer (1,403 profiles). Demand: ManpowerGroup MEOS India Q4 2026, national. Growth: Naukri JobSpeak Aug 2026, auto sector.',
     'https://www.payscale.com/research/IN/Job=Mechanical_Engineer/Salary'),
    ('Robotics Engineer', 393054, 500198, 54, 19, '2025-06-11',
     'Salary: PayScale India, Robotics Engineer (67 profiles, small sample). Demand: ManpowerGroup MEOS India Q4 2026, national. Growth: Naukri JobSpeak Aug 2026, auto sector.',
     'https://www.payscale.com/research/IN/Job=Robotics_Engineer/Salary'),
    ('Medical Doctor (MBBS)', 621036, 714892, 54, 16, '2026-03-06',
     'Salary: PayScale India, Physician / Doctor, General Practice (81 profiles). Demand: ManpowerGroup MEOS India Q4 2026, national. Growth: Naukri JobSpeak Aug 2026, healthcare.',
     'https://www.payscale.com/research/IN/Job=Physician_%2F_Doctor%2C_General_Practice/Salary'),
    ('Biotechnology Researcher', 505652, 610419, 54, 2, '2026-06-16',
     'Salary: PayScale India, Research Scientist, Biotechnology (64 profiles). Demand: ManpowerGroup MEOS India Q4 2026, national. Growth: Naukri JobSpeak Aug 2026, pharma/biotech.',
     'https://www.payscale.com/research/IN/Job=Research_Scientist%2C_Biotechnology/Salary'),
    ('Chartered Accountant (CA)', 730413, 1017284, 60, 10, '2026-06-16',
     'Salary: PayScale India, Chartered Accountant (478 profiles). Demand: ManpowerGroup MEOS India Q4 2026, Finance & Insurance. Growth: Naukri JobSpeak Aug 2026, banking/financial services.',
     'https://www.payscale.com/research/IN/Job=Chartered_Accountant/Salary'),
    ('Investment Banker', 606782, 886080, 60, 10, '2026-03-26',
     'Salary: PayScale India, Investment Banker (51 profiles). Demand: ManpowerGroup MEOS India Q4 2026, Finance & Insurance. Growth: Naukri JobSpeak Aug 2026, banking/financial services.',
     'https://www.payscale.com/research/IN/Job=Investment_Banker/Salary'),
    ('UX/UI Designer', 400661, 610954, 57, 11, '2026-06-08',
     'Salary: PayScale India, UX Designer (484 profiles). Demand: ManpowerGroup MEOS India Q4 2026, Information sector. Growth: Naukri JobSpeak Aug 2026, IT/software services.',
     'https://www.payscale.com/research/IN/Job=UX_Designer/Salary'),
    ('Educational Policy Specialist', 336000, 594952, 54, -8, '2025-04-01',
     'Salary: PayScale India, Policy Analyst (9 profiles, small sample). Demand: ManpowerGroup MEOS India Q4 2026, national. Growth: Naukri JobSpeak Aug 2026, education.',
     'https://www.payscale.com/research/IN/Job=Policy_Analyst/Salary'),
    ('Agricultural Scientist', 335000, 400756, 54, 14, '2025-08-14',
     'Salary: PayScale India, Agronomist (31 profiles, small sample). Demand: ManpowerGroup MEOS India Q4 2026, national. Growth: Naukri JobSpeak Aug 2026, overall (sector not reported).',
     'https://www.payscale.com/research/IN/Job=Agronomist/Salary'),
    ('Corporate Lawyer', 585549, 616736, 54, 14, '2026-03-16',
     'Salary: PayScale India, Corporate Lawyer (56 profiles). Demand: ManpowerGroup MEOS India Q4 2026, national. Growth: Naukri JobSpeak Aug 2026, overall (sector not reported).',
     'https://www.payscale.com/research/IN/Job=Corporate_Lawyer/Salary'),
    ('Armed Forces Officer (NDA)', 859200, 859200, 54, 14, '2026-05-20',
     'Pay: UPSC NDA & NA (II) 2026 notice, Lieutenant Level 10 basic + Military Service Pay, before allowances (used for both figures). Demand and growth: national ManpowerGroup and JobSpeak figures, as no defence figure is published.',
     'https://www.upsc.gov.in/sites/default/files/Notif-NDA-II-2026-Engl-200526.pdf')
) AS v(career, entry_salary, median_salary, demand, growth, as_of, source, url)
JOIN careers c ON c.name = v.career
ON CONFLICT (career_id, region, as_of) DO UPDATE SET
    entry_salary  = EXCLUDED.entry_salary,
    median_salary = EXCLUDED.median_salary,
    demand_index  = EXCLUDED.demand_index,
    growth_rate   = EXCLUDED.growth_rate,
    source        = EXCLUDED.source,
    source_url    = EXCLUDED.source_url,
    estimated     = EXCLUDED.estimated;

-- Living cost: average monthly per-capita consumption in urban India, Household Consumption Expenditure
-- Survey 2023-24 (MoSPI press note, 27 Dec 2024). Used for living costs while studying (when a college's
-- hostel and mess cost isn't known) and after graduation (break-even). It's a per-person household average,
-- so a single person living alone in a big city will usually spend more.
INSERT INTO regions (name, monthly_living_cost, source, source_url, as_of, estimated) VALUES
    ('India', 6996, 'MoSPI, Household Consumption Expenditure Survey 2023-24: average urban MPCE',
     'https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf',
     DATE '2024-12-27', false)
ON CONFLICT (name) DO UPDATE SET
    monthly_living_cost = EXCLUDED.monthly_living_cost,
    source              = EXCLUDED.source,
    source_url          = EXCLUDED.source_url,
    as_of               = EXCLUDED.as_of,
    estimated           = EXCLUDED.estimated;
