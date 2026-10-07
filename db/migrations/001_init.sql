-- =============================================================================
-- PRISM Engine database, migration 001: the whole schema.
--
-- Runs on Supabase (PostgreSQL 15+) as one transaction: paste it into the SQL editor, or
-- psql -v ON_ERROR_STOP=1 -1 -f db/migrations/001_init.sql. Run it once; later changes go in 002, 003, ...
-- Local tests first run db/tests/supabase_shim.sql, which creates what Supabase already provides
-- (the auth schema and the anon / authenticated / service_role roles).
--
-- Nobody but the backend reads these tables. The browser only calls our API, and the backend connects
-- as the table owner, so RLS is on with no policies and the browser roles get no grants at all.
-- =============================================================================


-- ---------- shared value lists ----------
-- backend/tests/test_db_consistency.py checks these against the backend's enums.

CREATE DOMAIN user_role AS TEXT CHECK (VALUE IN ('student', 'parent'));

-- The 36 states and union territories, spelled like the backend's IndianState, plus 'India' for national data.
CREATE DOMAIN region_name AS TEXT CHECK (VALUE IN (
    'India',
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
    'Puducherry'
));
CREATE DOMAIN indian_state AS region_name CHECK (VALUE <> 'India');

CREATE DOMAIN social_category AS TEXT CHECK (VALUE IN ('general', 'obc', 'sc', 'st', 'ews'));
CREATE DOMAIN gender_type AS TEXT CHECK (VALUE IN ('female', 'male', 'other'));
CREATE DOMAIN course_level AS TEXT CHECK (VALUE IN ('UG', 'PG'));

-- Money is whole rupees, the same unit as the API.
CREATE DOMAIN rupees AS INTEGER CHECK (VALUE >= 0);

-- The 13 trait dimensions and their groups (backend guide, section 4, step 1).
CREATE FUNCTION public.trait_groups() RETURNS TABLE (grp TEXT, dimension TEXT)
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
    VALUES ('aptitude', 'logical'), ('aptitude', 'numerical'), ('aptitude', 'verbal'), ('aptitude', 'spatial'),
           ('aptitude', 'creative'),
           ('interest', 'realistic'), ('interest', 'investigative'), ('interest', 'artistic'), ('interest', 'social'),
           ('interest', 'enterprising'), ('interest', 'conventional'),
           ('cognitive', 'analytical'), ('cognitive', 'structured')
$$;

CREATE FUNCTION public.is_trait_dimension(candidate TEXT) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
    SELECT EXISTS (SELECT 1 FROM public.trait_groups() AS t WHERE t.dimension = candidate)
$$;

CREATE DOMAIN trait_dimension AS TEXT CHECK (public.is_trait_dimension(VALUE));

-- A career's trait weights: {"aptitude": {...}, "interest": {...}, "cognitive": {...}}.
-- Each group holds only its own dimensions, every weight is between 0 and 1, and each group sums to 1.
CREATE FUNCTION public.valid_trait_weights(weights JSONB) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
    SELECT jsonb_typeof(weights) = 'object'
       AND (SELECT array_agg(g ORDER BY g) FROM jsonb_object_keys(weights) AS g)
           = ARRAY['aptitude', 'cognitive', 'interest']
       AND NOT EXISTS (
           SELECT 1
           FROM jsonb_each(weights) AS grp(name, members)
           WHERE jsonb_typeof(grp.members) <> 'object'
              OR EXISTS (
                     SELECT 1
                     FROM jsonb_each(grp.members) AS m(dimension, weight)
                     WHERE (grp.name, m.dimension) NOT IN (SELECT t.grp, t.dimension FROM public.trait_groups() AS t)
                        OR jsonb_typeof(m.weight) <> 'number'
                        OR m.weight::numeric NOT BETWEEN 0 AND 1)
              OR abs(coalesce((SELECT sum(m.weight::numeric) FROM jsonb_each(grp.members) AS m(dimension, weight)), 0)
                     - 1) > 0.001)
$$;


-- ---------- people ----------

-- One row per Supabase account; created by handle_new_user() below when someone signs up.
CREATE TABLE users (
    id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    role       user_role NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    full_name  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id, role)  -- lets the tables below check a person's role with a foreign key
);

-- A student's current invite. Creating a new one replaces it; linking deletes it.
-- The *_role columns are fixed, so the foreign key only matches students.
CREATE TABLE invites (
    student_id   UUID PRIMARY KEY,
    student_role user_role NOT NULL DEFAULT 'student' CHECK (student_role = 'student'),
    code_hash    TEXT NOT NULL UNIQUE CHECK (code_hash ~ '^[0-9a-f]{64}$'),  -- SHA-256 of the code; never the code
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (student_id, student_role) REFERENCES users (id, role) ON DELETE CASCADE
);

-- One student <-> one parent.
CREATE TABLE pairs (
    student_id   UUID PRIMARY KEY,
    student_role user_role NOT NULL DEFAULT 'student' CHECK (student_role = 'student'),
    parent_id    UUID NOT NULL UNIQUE,
    parent_role  user_role NOT NULL DEFAULT 'parent' CHECK (parent_role = 'parent'),
    linked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (student_id, student_role) REFERENCES users (id, role) ON DELETE CASCADE,
    FOREIGN KEY (parent_id, parent_role) REFERENCES users (id, role) ON DELETE CASCADE
);

-- What PUT /profile saves. Parents fill the money fields; students fill home_state and the scholarship fields.
CREATE TABLE profiles (
    user_id                   UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    trait_vector              JSONB,  -- the student's 13 trait scores, written by the backend after scoring
    -- parent
    annual_education_budget   rupees,
    savings                   rupees,
    max_loan                  rupees,
    annual_income             rupees,  -- optional; only for scholarship income limits
    breakeven_tolerance_years SMALLINT CHECK (breakeven_tolerance_years BETWEEN 1 AND 20),
    -- both
    risk_appetite             SMALLINT CHECK (risk_appetite BETWEEN 1 AND 5),
    preferred_state           indian_state,
    open_to_abroad            BOOLEAN,
    -- student (category, percentage and gender are optional and only used for scholarship rules)
    home_state                indian_state,
    category                  social_category,
    percentage                NUMERIC(5, 2) CHECK (percentage BETWEEN 0 AND 100),
    gender                    gender_type,
    assessment_completed_at   TIMESTAMPTZ,
    consent_to_compare        BOOLEAN NOT NULL DEFAULT false,
    consent_at                TIMESTAMPTZ,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (consent_to_compare = (consent_at IS NOT NULL))
);


-- ---------- assessment ----------

CREATE TABLE domains (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
);

-- The parent's top 3 domains, first choice = rank 1. The backend writes all three together.
CREATE TABLE parent_domain_prefs (
    parent_id   UUID NOT NULL,
    parent_role user_role NOT NULL DEFAULT 'parent' CHECK (parent_role = 'parent'),
    rank        SMALLINT NOT NULL CHECK (rank BETWEEN 1 AND 3),
    domain_id   UUID NOT NULL REFERENCES domains (id) ON DELETE RESTRICT,
    PRIMARY KEY (parent_id, rank),
    UNIQUE (parent_id, domain_id),
    FOREIGN KEY (parent_id, parent_role) REFERENCES users (id, role) ON DELETE CASCADE
);
CREATE INDEX parent_domain_prefs_domain_id_idx ON parent_domain_prefs (domain_id);

-- 'likert': rate a statement 1-5. 'choice': one correct option, graded 1 or 0 by the backend.
-- options is what the screen shows: [{"value": 1, "label": "..."}, ...]. correct_value is the answer key and
-- never leaves the server.
CREATE TABLE questions (
    id             UUID PRIMARY KEY,
    audience       user_role NOT NULL,
    position       SMALLINT NOT NULL CHECK (position > 0),
    kind           TEXT NOT NULL CHECK (kind IN ('likert', 'choice')),
    dimension      trait_dimension NOT NULL,
    text           TEXT NOT NULL,
    options        JSONB NOT NULL CHECK (jsonb_typeof(options) = 'array'),
    correct_value  SMALLINT,
    reverse_scored BOOLEAN NOT NULL DEFAULT false,
    required       BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (audience, position),
    -- coalesce: a CHECK that comes out NULL counts as passed, so a missing answer key must be a plain false
    CHECK (coalesce(CASE kind
               WHEN 'likert' THEN jsonb_array_length(options) = 5 AND correct_value IS NULL
               WHEN 'choice' THEN jsonb_array_length(options) BETWEEN 2 AND 5
                                  AND correct_value BETWEEN 1 AND jsonb_array_length(options)
                                  AND NOT reverse_scored
           END, false))
);

CREATE TABLE responses (
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    value       SMALLINT NOT NULL CHECK (value BETWEEN 1 AND 5),  -- likert rating, or the picked option
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),               -- the backend sets it on every upsert
    PRIMARY KEY (user_id, question_id)
);
CREATE INDEX responses_question_id_idx ON responses (question_id);


-- ---------- careers and costs ----------

CREATE TABLE careers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL UNIQUE,
    domain_id      UUID NOT NULL REFERENCES domains (id) ON DELETE RESTRICT,
    education_path TEXT NOT NULL,
    trait_weights  JSONB CHECK (public.valid_trait_weights(trait_weights))  -- filled by feat/db-career-trait-weights
);
CREATE INDEX careers_domain_id_idx ON careers (domain_id);

-- A programme leading to the career. 'UG' starts after Class 12; 'PG' after a first degree.
CREATE TABLE courses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id      UUID NOT NULL REFERENCES careers (id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    level          course_level NOT NULL,
    duration_years NUMERIC(3, 1) NOT NULL CHECK (duration_years > 0),
    UNIQUE (career_id, name)
);

-- One way into a course: an entrance exam and a college. The solver costs a path as
-- (annual_fee + annual_living_cost) x the course's duration_years.
-- Every figure needs a source_url and as_of date, or estimated = true.
CREATE TABLE exams_colleges (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id          UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    exam               TEXT NOT NULL,
    college            TEXT NOT NULL,
    city               TEXT,
    state              indian_state,
    annual_fee         rupees,  -- tuition per year
    annual_living_cost rupees,  -- hostel and mess per year
    rank               INTEGER CHECK (rank > 0),
    rank_source        TEXT,    -- e.g. 'NIRF 2025 Engineering'
    source             TEXT NOT NULL,
    source_url         TEXT,
    as_of              DATE,
    estimated          BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (course_id, college, exam),
    CHECK (estimated OR (source_url IS NOT NULL AND as_of IS NOT NULL))
);

-- Demand and pay for a career in one region ('India' = the national figure used as a fallback).
CREATE TABLE market_data (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id     UUID NOT NULL REFERENCES careers (id) ON DELETE CASCADE,
    region        region_name NOT NULL,
    demand_index  NUMERIC(5, 2) CHECK (demand_index BETWEEN 0 AND 100),
    entry_salary  rupees,         -- per year, for a fresher (used for break-even)
    median_salary rupees,         -- per year
    growth_rate   NUMERIC(5, 2),  -- expected yearly growth in openings, in percent
    source        TEXT NOT NULL,
    source_url    TEXT,
    as_of         DATE NOT NULL,
    estimated     BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (career_id, region, as_of),
    CHECK (estimated OR source_url IS NOT NULL)
);

-- Cost of living after graduation, for break-even: net salary = starting salary - 12 x monthly_living_cost.
CREATE TABLE regions (
    name                region_name PRIMARY KEY,
    monthly_living_cost rupees NOT NULL,
    source              TEXT NOT NULL,
    source_url          TEXT,
    as_of               DATE,
    estimated           BOOLEAN NOT NULL DEFAULT false,
    CHECK (estimated OR (source_url IS NOT NULL AND as_of IS NOT NULL))
);

-- Eligibility columns left empty mean "no restriction". eligibility_text is the rule in words, for families.
CREATE TABLE scholarships (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL UNIQUE,
    provider         TEXT NOT NULL,
    amount           rupees NOT NULL,
    amount_period    TEXT NOT NULL CHECK (amount_period IN ('one_time', 'per_year')),
    deadline         DATE,
    income_limit     rupees,                -- yearly family income at or below this
    categories       social_category[] NOT NULL DEFAULT '{}',
    states           indian_state[] NOT NULL DEFAULT '{}',
    min_percentage   NUMERIC(5, 2) CHECK (min_percentage BETWEEN 0 AND 100),
    gender           gender_type,
    course_level     course_level,
    eligibility_text TEXT NOT NULL,
    source           TEXT NOT NULL,
    source_url       TEXT,
    as_of            DATE,
    estimated        BOOLEAN NOT NULL DEFAULT false,
    CHECK (estimated OR (source_url IS NOT NULL AND as_of IS NOT NULL))
);

CREATE TABLE scholarship_careers (
    scholarship_id UUID NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
    career_id      UUID NOT NULL REFERENCES careers (id) ON DELETE CASCADE,
    PRIMARY KEY (scholarship_id, career_id)
);
CREATE INDEX scholarship_careers_career_id_idx ON scholarship_careers (career_id);


-- ---------- results ----------

-- response is the whole POST /analyze answer; GET /results/{id} returns it as stored.
CREATE TABLE results (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    weights        JSONB NOT NULL,
    conflict_index SMALLINT NOT NULL CHECK (conflict_index BETWEEN 0 AND 100),
    response       JSONB NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX results_student_id_idx ON results (student_id, created_at DESC);
CREATE INDEX results_parent_id_idx ON results (parent_id);

-- Cache for POST /explain: one text per result, career and model.
CREATE TABLE explanations (
    result_id  UUID NOT NULL REFERENCES results (id) ON DELETE CASCADE,
    career_id  UUID NOT NULL REFERENCES careers (id) ON DELETE CASCADE,
    model      TEXT NOT NULL,
    text       TEXT NOT NULL,
    source     TEXT NOT NULL CHECK (source IN ('gemini', 'template')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (result_id, career_id, model)
);
CREATE INDEX explanations_career_id_idx ON explanations (career_id);


-- ---------- triggers ----------

CREATE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END $$;

CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Every new Supabase account gets a users row, with the role and name the frontend passed in
-- supabase.auth.signUp({ options: { data: { role, full_name } } }).
-- SECURITY DEFINER lets it write public.users, which no client role can.
CREATE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    signup_role TEXT := NEW.raw_user_meta_data ->> 'role';
BEGIN
    IF signup_role IS NULL OR signup_role NOT IN ('student', 'parent') THEN
        -- TODO(Snehank): decide what a sign-up without a valid role does (about 3 lines).
        --   Reject it:          RAISE EXCEPTION 'sign-up needs a role: student or parent';
        --                       (Supabase then shows the person a generic sign-up error)
        --   Default to student: signup_role := 'student';
        --                       (never fails, but a parent could silently become a student)
        --   Skip the row:       RETURN NEW;
        --                       (the account exists, but every API call fails until someone fixes it)
        -- Until you choose, the INSERT below fails the role check, which rejects the sign-up.
        NULL;
    END IF;

    INSERT INTO public.users (id, role, email, full_name)
    VALUES (NEW.id, signup_role, NEW.email, NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''));
    RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------- security ----------

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
