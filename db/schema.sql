-- =============================================================================
-- PRISM Engine Database Schema (PostgreSQL)
-- Problem: DataQuest 3.0 (DQNM)
-- Layer: Database & Data (Joel)
--
-- Table Owners & Descriptions:
-- 1. users                  - Snehank (Auth/Identity), Joel (Data model)
-- 2. pairs [NEW]            - Snehank (Auth linking), Joel (Relationship model)
-- 3. questions              - Joel (Seed data/Questions bank)
-- 4. responses              - Snehank (Assessment scoring), Aayush (Assessment UI)
-- 5. profiles               - Snehank (Solver/Conflict Engine), Aayush (Profile UI)
-- 6. domains                - Snehank (Domain scoring), Joel (Taxonomy)
-- 7. parent_domain_prefs    - Snehank (Conflict Index), Aayush (Parent ranking UI)
-- 8. careers                - Snehank (Career scoring & matching), Aayush (Roadmap UI)
-- 9. courses                - Snehank (Financial solver), Aayush (Roadmap details)
-- 10. market_data           - Snehank (Market blending algorithm), Joel (Data curation)
-- 11. exams_colleges        - Snehank (Roadmap generator), Aayush (College cards)
-- 12. scholarships          - Snehank (Financial solver eligibility matching)
-- 13. scholarship_careers   - Snehank (Scholarship queries), Joel (Data linkage)
-- 14. results               - Snehank (Engine outputs), Aayush (Dashboard & PDF)
-- 15. explanations [NEW]    - Snehank (Gemini response cache)
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
    invite_token_hash TEXT UNIQUE,
    invite_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_linked_user_id ON users(linked_user_id);

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

-- 2. PAIRS TABLE [NEW]
CREATE TABLE IF NOT EXISTS pairs (
    student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pairs_parent_id ON pairs(parent_id);

-- 3. QUESTIONS TABLE
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

-- 4. RESPONSES TABLE
-- Value choice justification: JSONB handles option IDs, strings, sliders, budgets, or rank arrays.
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_responses_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);

-- 5. PROFILES TABLE
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

-- updated_at trigger for profiles
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

-- 6. DOMAINS TABLE
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PARENT DOMAIN PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS parent_domain_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    rank INT NOT NULL CHECK (rank BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_parent_domain_prefs_parent_rank UNIQUE (parent_id, rank),
    CONSTRAINT uq_parent_domain_prefs_parent_domain UNIQUE (parent_id, domain_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_domain_prefs_domain_id ON parent_domain_prefs(domain_id);

-- 8. CAREERS TABLE
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

-- 9. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT CHECK (level IS NULL OR level IN ('UG', 'PG')),
    duration_years NUMERIC(3,1) CHECK (duration_years IS NULL OR duration_years > 0),
    total_cost NUMERIC(12,2) CHECK (total_cost IS NULL OR total_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_career_id ON courses(career_id);

-- 10. MARKET DATA TABLE
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    region TEXT NOT NULL CHECK (
        region IN (
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
            'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
            'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
            'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
            'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 
            'Ladakh', 'Lakshadweep', 'Puducherry', 'India'
        )
    ),
    demand_index NUMERIC(5,2) CHECK (demand_index IS NULL OR (demand_index BETWEEN 0 AND 100)),
    median_salary NUMERIC(12,2) CHECK (median_salary IS NULL OR median_salary >= 0),
    entry_salary NUMERIC(12,2) CHECK (entry_salary IS NULL OR entry_salary >= 0),
    growth_rate NUMERIC(5,2),
    as_of DATE NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    estimated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_market_data_career_region_asof UNIQUE (career_id, region, as_of)
);

-- 11. EXAMS & COLLEGES TABLE
CREATE TABLE IF NOT EXISTS exams_colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    exam TEXT NOT NULL,
    college TEXT NOT NULL,
    city TEXT,
    state TEXT,
    annual_fee NUMERIC(12,2) CHECK (annual_fee IS NULL OR annual_fee >= 0),
    annual_living_cost NUMERIC(12,2) CHECK (annual_living_cost IS NULL OR annual_living_cost >= 0),
    rank INT CHECK (rank IS NULL OR rank > 0),
    source TEXT NOT NULL DEFAULT 'NIRF 2026 / Official Portal',
    source_url TEXT,
    as_of DATE NOT NULL DEFAULT '2026-09-01',
    estimated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exams_colleges_career_college_exam UNIQUE (career_id, college, exam)
);

CREATE INDEX IF NOT EXISTS idx_exams_colleges_career_id ON exams_colleges(career_id);
CREATE INDEX IF NOT EXISTS idx_exams_colleges_course_id ON exams_colleges(course_id);

-- 12. SCHOLARSHIPS TABLE
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    amount NUMERIC(12,2) CHECK (amount IS NULL OR amount >= 0),
    amount_period TEXT NOT NULL DEFAULT 'one_time' CHECK (amount_period IN ('one_time', 'per_year')),
    deadline DATE,
    provider TEXT,
    source_url TEXT,
    as_of DATE NOT NULL DEFAULT '2026-09-01',
    estimated BOOLEAN NOT NULL DEFAULT false,
    income_limit NUMERIC(12,2) CHECK (income_limit IS NULL OR income_limit >= 0),
    category TEXT[] CONSTRAINT chk_scholarship_category CHECK (category <@ ARRAY['general','obc','sc','st','ews']),
    state TEXT[],
    min_percentage NUMERIC(5,2) CHECK (min_percentage IS NULL OR (min_percentage BETWEEN 0 AND 100)),
    gender TEXT CHECK (gender IS NULL OR gender IN ('female','male','other','any')),
    extra_rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. SCHOLARSHIP CAREERS M2M TABLE
CREATE TABLE IF NOT EXISTS scholarship_careers (
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    PRIMARY KEY (scholarship_id, career_id)
);

CREATE INDEX IF NOT EXISTS idx_scholarship_careers_career_id ON scholarship_careers(career_id);

-- 14. RESULTS TABLE
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

-- 15. EXPLANATIONS TABLE
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

-- 16. ROW-LEVEL SECURITY (RLS) & READ POLICIES FOR CATALOG TABLES
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
