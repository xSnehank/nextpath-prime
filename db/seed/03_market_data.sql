-- =============================================================================
-- PRISM Engine Seed Script: 03_market_data.sql
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- PLACEHOLDER DATA: replace with cited figures before final demo.
--
-- Description:
-- Idempotent seed for career market demand, median salary, and growth rate metrics
-- across 4 Indian regions (Bengaluru/Karnataka, Delhi NCR, Chennai/Tamil Nadu,
-- and India (national)).
-- All entries have estimated = true as per PRISM data honesty guidelines.
-- =============================================================================

INSERT INTO market_data (career_id, region, demand_index, median_salary, growth_rate, as_of, source, source_url, estimated)
SELECT 
    c.id, 
    val.region, 
    val.demand_index, 
    val.median_salary, 
    val.growth_rate, 
    val.as_of::DATE, 
    val.source, 
    val.source_url, 
    val.estimated
FROM (VALUES
    -- =========================================================================
    -- 1. Software Engineer
    -- =========================================================================
    ('Software Engineer', 'Bengaluru/Karnataka', 92.00, 1200000.00, 14.50, '2026-01-01', 'NASSCOM IT-BPM Workforce Report', 'https://todo.source.url/nasscom-se-bengaluru', true),
    ('Software Engineer', 'Delhi NCR', 85.00, 1050000.00, 12.80, '2026-01-01', 'Naukri JobSpeak Index', 'https://todo.source.url/naukri-se-delhi', true),
    ('Software Engineer', 'Chennai/Tamil Nadu', 82.00, 950000.00, 11.50, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-se-chennai', true),
    ('Software Engineer', 'India (national)', 78.00, 850000.00, 10.20, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-se-national', true),

    -- =========================================================================
    -- 2. Data Scientist
    -- =========================================================================
    ('Data Scientist', 'Bengaluru/Karnataka', 95.00, 1450000.00, 18.20, '2026-01-01', 'NASSCOM AI & Data Talent Report', 'https://todo.source.url/nasscom-ds-bengaluru', true),
    ('Data Scientist', 'Delhi NCR', 88.00, 1300000.00, 16.50, '2026-01-01', 'Naukri JobSpeak Index', 'https://todo.source.url/naukri-ds-delhi', true),
    ('Data Scientist', 'Chennai/Tamil Nadu', 80.00, 1100000.00, 14.00, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-ds-chennai', true),
    ('Data Scientist', 'India (national)', 82.00, 1000000.00, 15.00, '2026-01-01', 'Analytics India Magazine Salary Survey', 'https://todo.source.url/aim-ds-national', true),

    -- =========================================================================
    -- 3. Mechanical Engineer
    -- =========================================================================
    ('Mechanical Engineer', 'Chennai/Tamil Nadu', 84.00, 750000.00, 8.50, '2026-01-01', 'Auto Components Manufacturers Association (ACMA)', 'https://todo.source.url/acma-me-chennai', true),
    ('Mechanical Engineer', 'Bengaluru/Karnataka', 78.00, 800000.00, 9.00, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-me-bengaluru', true),
    ('Mechanical Engineer', 'Delhi NCR', 75.00, 720000.00, 7.80, '2026-01-01', 'Naukri JobSpeak Index', 'https://todo.source.url/naukri-me-delhi', true),
    ('Mechanical Engineer', 'India (national)', 70.00, 600000.00, 7.00, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-me-national', true),

    -- =========================================================================
    -- 4. Robotics Engineer
    -- =========================================================================
    ('Robotics Engineer', 'Bengaluru/Karnataka', 89.00, 1250000.00, 19.50, '2026-01-01', 'Robotics Society of India / NASSCOM DeepTech', 'https://todo.source.url/rsi-re-bengaluru', true),
    ('Robotics Engineer', 'Chennai/Tamil Nadu', 82.00, 1050000.00, 17.00, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-re-chennai', true),
    ('Robotics Engineer', 'Delhi NCR', 80.00, 1100000.00, 16.20, '2026-01-01', 'Naukri JobSpeak Index', 'https://todo.source.url/naukri-re-delhi', true),
    ('Robotics Engineer', 'India (national)', 75.00, 900000.00, 15.50, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-re-national', true),

    -- =========================================================================
    -- 5. Medical Doctor (MBBS)
    -- =========================================================================
    ('Medical Doctor (MBBS)', 'Delhi NCR', 96.00, 1200000.00, 11.00, '2026-01-01', 'National Health Authority Reports', 'https://todo.source.url/nha-doc-delhi', true),
    ('Medical Doctor (MBBS)', 'Chennai/Tamil Nadu', 94.00, 1000000.00, 10.50, '2026-01-01', 'Tamil Nadu Health Department / AmbitionBox', 'https://todo.source.url/tnhd-doc-chennai', true),
    ('Medical Doctor (MBBS)', 'Bengaluru/Karnataka', 92.00, 1100000.00, 10.80, '2026-01-01', 'Naukri JobSpeak Healthcare Index', 'https://todo.source.url/naukri-doc-bengaluru', true),
    ('Medical Doctor (MBBS)', 'India (national)', 90.00, 900000.00, 9.50, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-doc-national', true),

    -- =========================================================================
    -- 6. Biotechnology Researcher
    -- =========================================================================
    ('Biotechnology Researcher', 'Bengaluru/Karnataka', 85.00, 850000.00, 13.50, '2026-01-01', 'Association of Biotech Led Enterprises (ABLE)', 'https://todo.source.url/able-bio-bengaluru', true),
    ('Biotechnology Researcher', 'Delhi NCR', 78.00, 780000.00, 11.80, '2026-01-01', 'Naukri JobSpeak Index', 'https://todo.source.url/naukri-bio-delhi', true),
    ('Biotechnology Researcher', 'Chennai/Tamil Nadu', 76.00, 720000.00, 11.00, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-bio-chennai', true),
    ('Biotechnology Researcher', 'India (national)', 72.00, 650000.00, 10.00, '2026-01-01', 'Department of Biotechnology (DBT), GoI', 'https://todo.source.url/dbt-bio-national', true),

    -- =========================================================================
    -- 7. Chartered Accountant (CA)
    -- =========================================================================
    ('Chartered Accountant (CA)', 'Delhi NCR', 91.00, 1150000.00, 10.20, '2026-01-01', 'ICAI Placement Committee Annual Report', 'https://todo.source.url/icai-ca-delhi', true),
    ('Chartered Accountant (CA)', 'Bengaluru/Karnataka', 88.00, 1200000.00, 11.00, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-ca-bengaluru', true),
    ('Chartered Accountant (CA)', 'Chennai/Tamil Nadu', 85.00, 1000000.00, 9.50, '2026-01-01', 'ICAI Regional Placement Data', 'https://todo.source.url/icai-ca-chennai', true),
    ('Chartered Accountant (CA)', 'India (national)', 84.00, 900000.00, 9.00, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-ca-national', true),

    -- =========================================================================
    -- 8. Investment Banker
    -- =========================================================================
    ('Investment Banker', 'Delhi NCR', 88.00, 2400000.00, 14.00, '2026-01-01', 'VCCircle / Economic Times Financial Report', 'https://todo.source.url/vccircle-ib-delhi', true),
    ('Investment Banker', 'Bengaluru/Karnataka', 86.00, 2200000.00, 15.20, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-ib-bengaluru', true),
    ('Investment Banker', 'Chennai/Tamil Nadu', 75.00, 1800000.00, 12.00, '2026-01-01', 'Naukri JobSpeak Index', 'https://todo.source.url/naukri-ib-chennai', true),
    ('Investment Banker', 'India (national)', 78.00, 1700000.00, 12.50, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-ib-national', true),

    -- =========================================================================
    -- 9. UX/UI Designer
    -- =========================================================================
    ('UX/UI Designer', 'Bengaluru/Karnataka', 90.00, 1100000.00, 16.50, '2026-01-01', 'NASSCOM Design Industry Report', 'https://todo.source.url/nasscom-ux-bengaluru', true),
    ('UX/UI Designer', 'Delhi NCR', 84.00, 980000.00, 14.80, '2026-01-01', 'Naukri JobSpeak Index', 'https://todo.source.url/naukri-ux-delhi', true),
    ('UX/UI Designer', 'Chennai/Tamil Nadu', 78.00, 850000.00, 13.00, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-ux-chennai', true),
    ('UX/UI Designer', 'India (national)', 76.00, 750000.00, 13.50, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-ux-national', true),

    -- =========================================================================
    -- 10. Educational Policy Specialist
    -- =========================================================================
    ('Educational Policy Specialist', 'Delhi NCR', 82.00, 750000.00, 9.80, '2026-01-01', 'NITI Aayog / Centre for Policy Research', 'https://todo.source.url/cpr-edu-delhi', true),
    ('Educational Policy Specialist', 'Bengaluru/Karnataka', 78.00, 780000.00, 10.50, '2026-01-01', 'Azim Premji Foundation Research Data', 'https://todo.source.url/apu-edu-bengaluru', true),
    ('Educational Policy Specialist', 'Chennai/Tamil Nadu', 72.00, 680000.00, 8.50, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-edu-chennai', true),
    ('Educational Policy Specialist', 'India (national)', 70.00, 600000.00, 8.00, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-edu-national', true),

    -- =========================================================================
    -- 11. Agricultural Scientist
    -- =========================================================================
    ('Agricultural Scientist', 'Chennai/Tamil Nadu', 80.00, 650000.00, 9.20, '2026-01-01', 'ICAR / TNAU Agri-Economic Review', 'https://todo.source.url/tnau-agri-chennai', true),
    ('Agricultural Scientist', 'Delhi NCR', 76.00, 700000.00, 9.50, '2026-01-01', 'IARI Placement & Research Cell', 'https://todo.source.url/iari-agri-delhi', true),
    ('Agricultural Scientist', 'Bengaluru/Karnataka', 78.00, 720000.00, 10.80, '2026-01-01', 'Naukri JobSpeak AgriTech Index', 'https://todo.source.url/naukri-agri-bengaluru', true),
    ('Agricultural Scientist', 'India (national)', 74.00, 580000.00, 8.50, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-agri-national', true),

    -- =========================================================================
    -- 12. Corporate Lawyer
    -- =========================================================================
    ('Corporate Lawyer', 'Delhi NCR', 93.00, 1600000.00, 13.00, '2026-01-01', 'RSG India Law Firm Rankings / Legal 500', 'https://todo.source.url/rsg-law-delhi', true),
    ('Corporate Lawyer', 'Bengaluru/Karnataka', 88.00, 1500000.00, 14.20, '2026-01-01', 'Bar Council Placement Survey', 'https://todo.source.url/bar-law-bengaluru', true),
    ('Corporate Lawyer', 'Chennai/Tamil Nadu', 82.00, 1200000.00, 11.50, '2026-01-01', 'AmbitionBox Salary Data', 'https://todo.source.url/ambitionbox-law-chennai', true),
    ('Corporate Lawyer', 'India (national)', 80.00, 1100000.00, 11.00, '2026-01-01', 'Periodic Labour Force Survey, MoSPI', 'https://todo.source.url/mospi-law-national', true)
) AS val(career_name, region, demand_index, median_salary, growth_rate, as_of, source, source_url, estimated)
JOIN careers c ON c.name = val.career_name
ON CONFLICT (career_id, region, as_of) DO UPDATE SET
    demand_index = EXCLUDED.demand_index,
    median_salary = EXCLUDED.median_salary,
    growth_rate = EXCLUDED.growth_rate,
    source = EXCLUDED.source,
    source_url = EXCLUDED.source_url,
    estimated = EXCLUDED.estimated;
