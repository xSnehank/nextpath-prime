-- =============================================================================
-- PRISM Engine Database Schema (PostgreSQL)
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Table Owners & Descriptions:
-- 1. users                  - Snehank (Auth/Identity), Joel (Data model)
-- 2. questions              - Joel (Seed data/Questions bank)
-- 3. responses              - Snehank (Assessment scoring), Aayush (Assessment UI)
-- 4. profiles               - Snehank (Solver/Conflict Engine), Aayush (Profile UI)
-- 5. domains [NEW]          - Snehank (Domain scoring), Joel (Taxonomy)
-- 6. parent_domain_prefs [NEW]- Snehank (Conflict Index), Aayush (Parent ranking UI)
-- 7. careers                - Snehank (Career scoring & matching), Aayush (Roadmap UI)
-- 8. courses [NEW]          - Snehank (Financial solver), Aayush (Roadmap details)
-- 9. market_data            - Snehank (Market blending algorithm), Joel (Data curation)
-- 10. exams_colleges        - Snehank (Roadmap generator), Aayush (College cards)
-- 11. scholarships          - Snehank (Financial solver eligibility matching)
-- 12. scholarship_careers [NEW]- Snehank (Scholarship queries), Joel (Data linkage)
-- 13. results               - Snehank (Engine outputs), Aayush (Dashboard & PDF)
-- 14. explanations [NEW]    - Snehank (Gemini response cache)
--
-- Views:
-- 1. v_careers              - Joins careers with domain names for easy API querying
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('student', 'parent')),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invite_token TEXT UNIQUE,
    invite_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_linked_user_id ON users(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_token ON users(invite_token);

-- Trigger for syncing Supabase auth.users to public.users
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

-- 2. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audience TEXT NOT NULL CHECK (audience IN ('student', 'parent')),
    dimension TEXT NOT NULL,
    position INT NOT NULL,
    text TEXT NOT NULL,
    options JSONB NOT NULL,
    answer_key JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_questions_audience_position UNIQUE (audience, position)
);

CREATE INDEX IF NOT EXISTS idx_questions_audience_position ON questions(audience, position);

-- 3. RESPONSES TABLE
-- Value choice justification: JSONB is selected because student responses may be option IDs/strings/arrays,
-- while parent responses may be numerical sliders, budgets, or rank arrays. JSONB handles both flexibly.
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_responses_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);

-- 4. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    trait_vector JSONB,
    budget NUMERIC(12,2) CHECK (budget IS NULL OR budget >= 0),
    savings NUMERIC(12,2) CHECK (savings IS NULL OR savings >= 0),
    loan_tolerance NUMERIC(12,2) CHECK (loan_tolerance IS NULL OR loan_tolerance >= 0),
    risk_appetite INT CHECK (risk_appetite IS NULL OR (risk_appetite BETWEEN 1 AND 5)),
    breakeven_tolerance_years NUMERIC(4,1) CHECK (breakeven_tolerance_years IS NULL OR breakeven_tolerance_years > 0),
    preferred_state TEXT,
    open_to_abroad BOOLEAN NOT NULL DEFAULT false,
    annual_income NUMERIC(12,2) CHECK (annual_income IS NULL OR annual_income >= 0),
    home_state TEXT,
    category TEXT,
    percentage NUMERIC(5,2) CHECK (percentage IS NULL OR (percentage BETWEEN 0 AND 100)),
    gender TEXT,
    assessment_completed_at TIMESTAMPTZ,
    consent_to_compare BOOLEAN NOT NULL DEFAULT false,
    consent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DOMAINS TABLE [NEW]
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PARENT DOMAIN PREFERENCES TABLE [NEW]
CREATE TABLE IF NOT EXISTS parent_domain_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    rank INT NOT NULL CHECK (rank BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_parent_domain_prefs_parent_rank UNIQUE (parent_id, rank),
    CONSTRAINT uq_parent_domain_prefs_parent_domain UNIQUE (parent_id, domain_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_domain_prefs_parent_id ON parent_domain_prefs(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_domain_prefs_domain_id ON parent_domain_prefs(domain_id);

-- 7. CAREERS TABLE
CREATE TABLE IF NOT EXISTS careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
    education_path TEXT,
    avg_course_cost NUMERIC(12,2) CHECK (avg_course_cost IS NULL OR avg_course_cost >= 0),
    trait_weights JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_careers_domain_id ON careers(domain_id);

-- View: v_careers for API convenience
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

-- 8. COURSES TABLE [NEW]
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_years NUMERIC(3,1) CHECK (duration_years IS NULL OR duration_years > 0),
    total_cost NUMERIC(12,2) CHECK (total_cost IS NULL OR total_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_career_id ON courses(career_id);

-- 9. MARKET DATA TABLE
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    region TEXT NOT NULL,
    demand_index NUMERIC(5,2) CHECK (demand_index IS NULL OR (demand_index BETWEEN 0 AND 100)),
    median_salary NUMERIC(12,2) CHECK (median_salary IS NULL OR median_salary >= 0),
    growth_rate NUMERIC(5,2),
    as_of DATE NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    estimated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_market_data_career_region_asof UNIQUE (career_id, region, as_of)
);

CREATE INDEX IF NOT EXISTS idx_market_data_career_id ON market_data(career_id);
CREATE INDEX IF NOT EXISTS idx_market_data_career_region ON market_data(career_id, region);

-- 10. EXAMS & COLLEGES TABLE
CREATE TABLE IF NOT EXISTS exams_colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    exam TEXT NOT NULL,
    college TEXT NOT NULL,
    annual_fee NUMERIC(12,2) CHECK (annual_fee IS NULL OR annual_fee >= 0),
    rank INT CHECK (rank IS NULL OR rank > 0),
    source TEXT NOT NULL DEFAULT 'NIRF 2026 / Official Portal',
    source_url TEXT,
    as_of DATE NOT NULL DEFAULT '2026-09-01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exams_colleges_career_college_exam UNIQUE (career_id, college, exam)
);

CREATE INDEX IF NOT EXISTS idx_exams_colleges_career_id ON exams_colleges(career_id);
CREATE INDEX IF NOT EXISTS idx_exams_colleges_course_id ON exams_colleges(course_id);

-- 11. SCHOLARSHIPS TABLE
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    amount NUMERIC(12,2) CHECK (amount IS NULL OR amount >= 0),
    deadline DATE,
    provider TEXT,
    source_url TEXT,
    estimated BOOLEAN NOT NULL DEFAULT false,
    income_limit NUMERIC(12,2) CHECK (income_limit IS NULL OR income_limit >= 0),
    category TEXT[],
    state TEXT[],
    min_percentage NUMERIC(5,2) CHECK (min_percentage IS NULL OR (min_percentage BETWEEN 0 AND 100)),
    gender TEXT,
    extra_rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. SCHOLARSHIP CAREERS M2M TABLE [NEW]
CREATE TABLE IF NOT EXISTS scholarship_careers (
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    PRIMARY KEY (scholarship_id, career_id)
);

CREATE INDEX IF NOT EXISTS idx_scholarship_careers_scholarship_id ON scholarship_careers(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_careers_career_id ON scholarship_careers(career_id);

-- 13. RESULTS TABLE
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scores JSONB NOT NULL,
    weights JSONB NOT NULL DEFAULT '{"fit": 0.45, "finance": 0.30, "market": 0.25}'::jsonb,
    conflict_index NUMERIC(5,2) CHECK (conflict_index IS NULL OR (conflict_index BETWEEN 0 AND 100)),
    roadmap JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_parent_id ON results(parent_id);

-- 14. EXPLANATIONS TABLE [NEW]
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
