-- =============================================================================
-- PRISM Engine Seed Script Runner
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Execution Order for Seed Scripts:
-- 1. 01_domains.sql           - Base career domains taxonomy (8+ domains)
-- 2. 02_questions.sql         - Question bank (Student ~30, Parent ~10 questions)
-- 3. 03_careers_courses.sql   - Careers, degree courses, exams, and colleges
-- 4. 04_market_data.sql       - Region-wise demand, salary, growth rate
-- 5. 05_scholarships.sql       - Scholarships, eligibility criteria & career links
-- 6. 06_demo_family.sql       - F1 One-click demo student, parent & linked answers
-- =============================================================================

-- Master Seed Runner Notice:
-- This script serves as the idempotent entry point for database seeding.
-- Subsequent seed files will append idempotent INSERT ... ON CONFLICT statements.

SELECT 'PRISM Engine seed script runner initialized successfully.' AS status;
