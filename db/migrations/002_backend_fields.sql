-- =============================================================================
-- PRISM Engine Migration: 002_backend_fields.sql
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Description:
-- Adds backend-required fields, trait weights for scoring, updated question
-- answer key isolation, profile enrichment, results linkages, Gemini explanation
-- caching table, exam/college course links, and Supabase auth user trigger.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CAREERS: Add trait_weights for scoring engine
ALTER TABLE careers ADD COLUMN IF NOT EXISTS trait_weights JSONB;

-- Recreate v_careers view to include trait_weights
CREATE OR REPLACE VIEW v_careers AS
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

-- 4. RESULTS: Add parent_id and weights
ALTER TABLE results ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE results ADD COLUMN IF NOT EXISTS weights JSONB NOT NULL DEFAULT '{"fit": 0.45, "finance": 0.30, "market": 0.25}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_results_parent_id ON results(parent_id);

-- 5. EXPLANATIONS: Gemini response cache table
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

-- 6. EXAMS & COLLEGES: Add course_id link, source, and date metadata
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'NIRF 2026 / Official Portal';
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE exams_colleges ADD COLUMN IF NOT EXISTS as_of DATE NOT NULL DEFAULT '2026-09-01';
CREATE INDEX IF NOT EXISTS idx_exams_colleges_course_id ON exams_colleges(course_id);

-- 7. USERS & SUPABASE AUTH: Trigger for syncing auth.users to public.users
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
