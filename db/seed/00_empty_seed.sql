-- =============================================================================
-- PRISM Engine Master Seed Script Runner
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Execution Order for Seed Scripts:
-- 1. 01_questions.sql         - Question bank (~32 student questions)
-- 2. 02_careers_courses.sql   - Domains, Careers, Courses, and Exams & Colleges
-- 3. 03_market_data.sql       - Region-wise demand index, salaries, and growth rates
-- =============================================================================

\set ON_ERROR_STOP on
\ir 01_questions.sql
\ir 02_careers_courses.sql
\ir 03_market_data.sql

SELECT 'PRISM Engine seed scripts executed successfully.' AS status;
