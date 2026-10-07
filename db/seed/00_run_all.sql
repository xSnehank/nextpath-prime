-- =============================================================================
-- Runs every seed file in order. psql only (\ir is a psql command, so this file can't go in Supabase's
-- SQL editor; there, run the files listed below one by one in this order):
--   psql -v ON_ERROR_STOP=1 -1 -d <database> -f db/seed/00_run_all.sql
-- Every seed file is safe to re-run.
-- =============================================================================

\set ON_ERROR_STOP on

\ir 01_questions.sql
\ir 02_careers_courses.sql
\ir 03_trait_weights.sql
\ir 04_market_data.sql
\ir 05_scholarships.sql
\ir 06_demo_family.sql
