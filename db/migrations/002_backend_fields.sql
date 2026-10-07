-- =============================================================================
-- PRISM Engine Migration: 002_backend_fields.sql
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Description:
-- Adds backend-required fields, trait weights for scoring, updated question
-- answer key isolation, profile enrichment, results linkages, Gemini explanation
-- caching table, exam/college course links, living costs, entry salaries,
-- hashed invite tokens, pairs table, RLS policies, updated_at triggers, and
-- drops redundant duplicate indexes.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CAREERS: Add trait_weights for scoring engine
ALTER TABLE careers ADD COLUMN IF NOT EXISTS trait_weights JSONB;

-- 2. QUESTIONS: Add answer_key column to isolate scoring secrets from client-facing options
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_key JSONB;

-- 3. PROFILES: Add student demographic & financial solver tolerance fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS breakeven_tolerance_years NUMERIC(4,1) CHECK (breakeven_tolerance_years IS NULL OR breakeven_tolerance_years > 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_to_abroad BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS annual_income NUMERIC(12,2) CHECK (annual_income IS NULL OR annual_income >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2) CHECK (percentage IS NULL OR (percentage BETWEEN 0 AND 100));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- 4. USERS & PAIRS: Hashed invite token & explicit student-parent pairs table
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token_hash TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS pairs (
    student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pairs_parent_id ON pairs(parent_id);

-- 5. COURSES: Add level (UG / PG)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IS NULL OR level IN ('UG', 'PG'));

-- 6. MARKET DATA: Add entry_salary
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS entry_salary NUMERIC(12,2) CHECK (entry_salary IS NULL OR entry_salary >= 0);

-- 7. EXAMS & COLLEGES: Add course_id link, living costs, location, source, and date metadata
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS annual_living_cost NUMERIC(12,2) CHECK (annual_living_cost IS NULL OR annual_living_cost >= 0);
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'NIRF 2026 / Official Portal';
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS as_of DATE NOT NULL DEFAULT '2026-09-01';
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS estimated BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_exams_colleges_course_id ON exams_colleges(course_id);

-- 8. SCHOLARSHIPS: Add amount_period, as_of date, and checked constraints
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS amount_period TEXT NOT NULL DEFAULT 'one_time' CHECK (amount_period IN ('one_time', 'per_year'));
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS as_of DATE NOT NULL DEFAULT '2026-09-01';

ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS chk_scholarship_category;
ALTER TABLE scholarships ADD CONSTRAINT chk_scholarship_category CHECK (category <@ ARRAY['general','obc','sc','st','ews']);

ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS chk_scholarship_gender;
ALTER TABLE scholarships ADD CONSTRAINT chk_scholarship_gender CHECK (gender IS NULL OR gender IN ('female','male','other','any'));

-- 9. RESULTS: Add parent_id and weights
ALTER TABLE results ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE results ADD COLUMN IF NOT EXISTS weights JSONB NOT NULL DEFAULT '{"fit": 0.45, "finance": 0.30, "market": 0.25}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_results_parent_id ON results(parent_id);

-- 10. EXPLANATIONS: Gemini response cache table
CREATE TABLE IF NOT EXISTS explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    weights_hash TEXT NOT NULL,
    model_name TEXT NOT NULL,
    explanation_text TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('gemini', 'template', 'cache')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_explanations_result_career_weights_model UNIQUE (result_id, career_id, weights_hash, model_name)
);

CREATE INDEX IF NOT EXISTS idx_explanations_result_id ON explanations(result_id);
CREATE INDEX IF NOT EXISTS idx_explanations_career_id ON explanations(career_id);

-- 11. TRIGGERS: set_updated_at and Supabase auth user sync
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 12. DROP REDUNDANT DUPLICATE INDEXES
DROP INDEX IF EXISTS idx_users_invite_token;
DROP INDEX IF EXISTS idx_questions_audience_position;
DROP INDEX IF EXISTS idx_responses_user_id;
DROP INDEX IF EXISTS idx_parent_domain_prefs_parent_id;
DROP INDEX IF EXISTS idx_market_data_career_id;
DROP INDEX IF EXISTS idx_market_data_career_region;
DROP INDEX IF EXISTS idx_scholarship_careers_scholarship_id;

-- 13. ROW-LEVEL SECURITY (RLS) & READ POLICIES FOR CATALOG TABLES
DO $$ 
DECLARE t text; 
BEGIN 
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  LOOP 
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t); 
  END LOOP; 
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_domains') THEN
        CREATE POLICY read_catalog_domains ON domains FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_careers') THEN
        CREATE POLICY read_catalog_careers ON careers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_courses') THEN
        CREATE POLICY read_catalog_courses ON courses FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_exams_colleges') THEN
        CREATE POLICY read_catalog_exams_colleges ON exams_colleges FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_market_data') THEN
        CREATE POLICY read_catalog_market_data ON market_data FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_scholarships') THEN
        CREATE POLICY read_catalog_scholarships ON scholarships FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_scholarship_careers') THEN
        CREATE POLICY read_catalog_scholarship_careers ON scholarship_careers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_catalog_questions') THEN
        CREATE POLICY read_catalog_questions ON questions FOR SELECT USING (true);
    END IF;
END $$;

-- Recreate v_careers view WITH security_invoker = true so view respects RLS
CREATE OR REPLACE VIEW v_careers WITH (security_invoker = true) AS
SELECT 
    c.id,
    c.name,
    c.domain_id,
    d.name AS domain_name,
    d.description AS domain_description,
    c.education_path,
    c.avg_course_cost,
    c.trait_weights,
    c.created_at
FROM careers c
JOIN domains d ON c.domain_id = d.id;
