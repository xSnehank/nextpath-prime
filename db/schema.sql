-- GENERATED from db/migrations by db/scripts/check_db.py --write (pg_dump 18). Do not edit.
-- A readable snapshot of the public schema; the migrations are the source of truth.

--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';

--
-- Name: course_level; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.course_level AS text
	CONSTRAINT course_level_check CHECK ((VALUE = ANY (ARRAY['UG'::text, 'PG'::text])));

--
-- Name: gender_type; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.gender_type AS text
	CONSTRAINT gender_type_check CHECK ((VALUE = ANY (ARRAY['female'::text, 'male'::text, 'other'::text])));

--
-- Name: region_name; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.region_name AS text
	CONSTRAINT region_name_check CHECK ((VALUE = ANY (ARRAY['India'::text, 'Andhra Pradesh'::text, 'Arunachal Pradesh'::text, 'Assam'::text, 'Bihar'::text, 'Chhattisgarh'::text, 'Goa'::text, 'Gujarat'::text, 'Haryana'::text, 'Himachal Pradesh'::text, 'Jharkhand'::text, 'Karnataka'::text, 'Kerala'::text, 'Madhya Pradesh'::text, 'Maharashtra'::text, 'Manipur'::text, 'Meghalaya'::text, 'Mizoram'::text, 'Nagaland'::text, 'Odisha'::text, 'Punjab'::text, 'Rajasthan'::text, 'Sikkim'::text, 'Tamil Nadu'::text, 'Telangana'::text, 'Tripura'::text, 'Uttar Pradesh'::text, 'Uttarakhand'::text, 'West Bengal'::text, 'Andaman and Nicobar Islands'::text, 'Chandigarh'::text, 'Dadra and Nagar Haveli and Daman and Diu'::text, 'Delhi'::text, 'Jammu and Kashmir'::text, 'Ladakh'::text, 'Lakshadweep'::text, 'Puducherry'::text])));

--
-- Name: indian_state; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.indian_state AS public.region_name
	CONSTRAINT indian_state_check CHECK (((VALUE)::text <> 'India'::text));

--
-- Name: rupees; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.rupees AS integer
	CONSTRAINT rupees_check CHECK ((VALUE >= 0));

--
-- Name: social_category; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.social_category AS text
	CONSTRAINT social_category_check CHECK ((VALUE = ANY (ARRAY['general'::text, 'obc'::text, 'sc'::text, 'st'::text, 'ews'::text])));

--
-- Name: is_trait_dimension(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_trait_dimension(candidate text) RETURNS boolean
    LANGUAGE sql IMMUTABLE STRICT
    SET search_path TO ''
    AS $$
    SELECT EXISTS (SELECT 1 FROM public.trait_groups() AS t WHERE t.dimension = candidate)
$$;

--
-- Name: trait_dimension; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.trait_dimension AS text
	CONSTRAINT trait_dimension_check CHECK (public.is_trait_dimension(VALUE));

--
-- Name: user_role; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.user_role AS text
	CONSTRAINT user_role_check CHECK ((VALUE = ANY (ARRAY['student'::text, 'parent'::text])));

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
    signup_role TEXT := NEW.raw_user_meta_data ->> 'role';
BEGIN
    IF signup_role IS NULL OR signup_role NOT IN ('student', 'parent') THEN
        RAISE EXCEPTION USING
            ERRCODE = 'check_violation',
            MESSAGE = 'Sign-up needs a role: student or parent.',
            HINT = 'Pass options.data.role to supabase.auth.signUp.';
    END IF;

    INSERT INTO public.users (id, role, email, full_name)
    VALUES (NEW.id, signup_role, NEW.email, NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''));
    RETURN NEW;
END $$;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END $$;

--
-- Name: trait_groups(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trait_groups() RETURNS TABLE(grp text, dimension text)
    LANGUAGE sql IMMUTABLE
    SET search_path TO ''
    AS $$
    VALUES ('aptitude', 'logical'), ('aptitude', 'numerical'), ('aptitude', 'verbal'), ('aptitude', 'spatial'),
           ('aptitude', 'creative'),
           ('interest', 'realistic'), ('interest', 'investigative'), ('interest', 'artistic'), ('interest', 'social'),
           ('interest', 'enterprising'), ('interest', 'conventional'),
           ('cognitive', 'analytical'), ('cognitive', 'structured')
$$;

--
-- Name: valid_trait_weights(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.valid_trait_weights(weights jsonb) RETURNS boolean
    LANGUAGE sql IMMUTABLE STRICT
    SET search_path TO ''
    AS $$
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: careers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.careers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    domain_id uuid NOT NULL,
    education_path text NOT NULL,
    trait_weights jsonb,
    CONSTRAINT careers_trait_weights_check CHECK (public.valid_trait_weights(trait_weights))
);

--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    career_id uuid NOT NULL,
    name text NOT NULL,
    level public.course_level NOT NULL,
    duration_years numeric(3,1) NOT NULL,
    CONSTRAINT courses_duration_years_check CHECK ((duration_years > (0)::numeric))
);

--
-- Name: domains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);

--
-- Name: exams_colleges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams_colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    exam text NOT NULL,
    college text NOT NULL,
    city text,
    state public.indian_state,
    annual_fee public.rupees,
    annual_living_cost public.rupees,
    rank integer,
    rank_source text,
    source text NOT NULL,
    source_url text,
    as_of date,
    estimated boolean DEFAULT false NOT NULL,
    CONSTRAINT exams_colleges_check CHECK ((estimated OR ((source_url IS NOT NULL) AND (as_of IS NOT NULL)))),
    CONSTRAINT exams_colleges_rank_check CHECK ((rank > 0))
);

--
-- Name: explanations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.explanations (
    result_id uuid NOT NULL,
    career_id uuid NOT NULL,
    model text NOT NULL,
    text text NOT NULL,
    source text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT explanations_source_check CHECK ((source = ANY (ARRAY['gemini'::text, 'template'::text])))
);

--
-- Name: invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invites (
    student_id uuid NOT NULL,
    student_role public.user_role DEFAULT 'student'::text NOT NULL,
    code_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invites_code_hash_check CHECK ((code_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT invites_student_role_check CHECK (((student_role)::text = 'student'::text))
);

--
-- Name: market_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    career_id uuid NOT NULL,
    region public.region_name NOT NULL,
    demand_index numeric(5,2),
    entry_salary public.rupees,
    median_salary public.rupees,
    growth_rate numeric(5,2),
    source text NOT NULL,
    source_url text,
    as_of date NOT NULL,
    estimated boolean DEFAULT false NOT NULL,
    CONSTRAINT market_data_check CHECK ((estimated OR (source_url IS NOT NULL))),
    CONSTRAINT market_data_demand_index_check CHECK (((demand_index >= (0)::numeric) AND (demand_index <= (100)::numeric)))
);

--
-- Name: pairs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pairs (
    student_id uuid NOT NULL,
    student_role public.user_role DEFAULT 'student'::text NOT NULL,
    parent_id uuid NOT NULL,
    parent_role public.user_role DEFAULT 'parent'::text NOT NULL,
    linked_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pairs_parent_role_check CHECK (((parent_role)::text = 'parent'::text)),
    CONSTRAINT pairs_student_role_check CHECK (((student_role)::text = 'student'::text))
);

--
-- Name: parent_domain_prefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parent_domain_prefs (
    parent_id uuid NOT NULL,
    parent_role public.user_role DEFAULT 'parent'::text NOT NULL,
    rank smallint NOT NULL,
    domain_id uuid NOT NULL,
    CONSTRAINT parent_domain_prefs_parent_role_check CHECK (((parent_role)::text = 'parent'::text)),
    CONSTRAINT parent_domain_prefs_rank_check CHECK (((rank >= 1) AND (rank <= 3)))
);

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    trait_vector jsonb,
    annual_education_budget public.rupees,
    savings public.rupees,
    max_loan public.rupees,
    annual_income public.rupees,
    breakeven_tolerance_years smallint,
    risk_appetite smallint,
    preferred_state public.indian_state,
    open_to_abroad boolean,
    home_state public.indian_state,
    category public.social_category,
    percentage numeric(5,2),
    gender public.gender_type,
    assessment_completed_at timestamp with time zone,
    consent_to_compare boolean DEFAULT false NOT NULL,
    consent_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_breakeven_tolerance_years_check CHECK (((breakeven_tolerance_years >= 1) AND (breakeven_tolerance_years <= 20))),
    CONSTRAINT profiles_check CHECK ((consent_to_compare = (consent_at IS NOT NULL))),
    CONSTRAINT profiles_percentage_check CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric))),
    CONSTRAINT profiles_risk_appetite_check CHECK (((risk_appetite >= 1) AND (risk_appetite <= 5)))
);

--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid NOT NULL,
    audience public.user_role NOT NULL,
    "position" smallint NOT NULL,
    kind text NOT NULL,
    dimension public.trait_dimension NOT NULL,
    text text NOT NULL,
    options jsonb NOT NULL,
    correct_value smallint,
    reverse_scored boolean DEFAULT false NOT NULL,
    required boolean DEFAULT true NOT NULL,
    CONSTRAINT questions_check CHECK (COALESCE(
CASE kind
    WHEN 'likert'::text THEN ((jsonb_array_length(options) = 5) AND (correct_value IS NULL))
    WHEN 'choice'::text THEN (((jsonb_array_length(options) >= 2) AND (jsonb_array_length(options) <= 5)) AND ((correct_value >= 1) AND (correct_value <= jsonb_array_length(options))) AND (NOT reverse_scored))
    ELSE NULL::boolean
END, false)),
    CONSTRAINT questions_kind_check CHECK ((kind = ANY (ARRAY['likert'::text, 'choice'::text]))),
    CONSTRAINT questions_options_check CHECK ((jsonb_typeof(options) = 'array'::text)),
    CONSTRAINT questions_position_check CHECK (("position" > 0))
);

--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    name public.region_name NOT NULL,
    monthly_living_cost public.rupees NOT NULL,
    source text NOT NULL,
    source_url text,
    as_of date,
    estimated boolean DEFAULT false NOT NULL,
    CONSTRAINT regions_check CHECK ((estimated OR ((source_url IS NOT NULL) AND (as_of IS NOT NULL))))
);

--
-- Name: responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responses (
    user_id uuid NOT NULL,
    question_id uuid NOT NULL,
    value smallint NOT NULL,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT responses_value_check CHECK (((value >= 1) AND (value <= 5)))
);

--
-- Name: results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    weights jsonb NOT NULL,
    conflict_index smallint NOT NULL,
    response jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT results_conflict_index_check CHECK (((conflict_index >= 0) AND (conflict_index <= 100)))
);

--
-- Name: scholarship_careers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scholarship_careers (
    scholarship_id uuid NOT NULL,
    career_id uuid NOT NULL
);

--
-- Name: scholarships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scholarships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    provider text NOT NULL,
    amount public.rupees NOT NULL,
    amount_period text NOT NULL,
    deadline date,
    income_limit public.rupees,
    categories public.social_category[] DEFAULT '{}'::public.social_category[] NOT NULL,
    states public.indian_state[] DEFAULT '{}'::public.indian_state[] NOT NULL,
    min_percentage numeric(5,2),
    gender public.gender_type,
    course_level public.course_level,
    eligibility_text text NOT NULL,
    source text NOT NULL,
    source_url text,
    as_of date,
    estimated boolean DEFAULT false NOT NULL,
    CONSTRAINT scholarships_amount_period_check CHECK ((amount_period = ANY (ARRAY['one_time'::text, 'per_year'::text]))),
    CONSTRAINT scholarships_check CHECK ((estimated OR ((source_url IS NOT NULL) AND (as_of IS NOT NULL)))),
    CONSTRAINT scholarships_min_percentage_check CHECK (((min_percentage >= (0)::numeric) AND (min_percentage <= (100)::numeric)))
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    role public.user_role NOT NULL,
    email text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: careers careers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.careers
    ADD CONSTRAINT careers_name_key UNIQUE (name);

--
-- Name: careers careers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.careers
    ADD CONSTRAINT careers_pkey PRIMARY KEY (id);

--
-- Name: courses courses_career_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_career_id_name_key UNIQUE (career_id, name);

--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);

--
-- Name: domains domains_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_name_key UNIQUE (name);

--
-- Name: domains domains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_pkey PRIMARY KEY (id);

--
-- Name: exams_colleges exams_colleges_course_id_college_exam_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams_colleges
    ADD CONSTRAINT exams_colleges_course_id_college_exam_key UNIQUE (course_id, college, exam);

--
-- Name: exams_colleges exams_colleges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams_colleges
    ADD CONSTRAINT exams_colleges_pkey PRIMARY KEY (id);

--
-- Name: explanations explanations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.explanations
    ADD CONSTRAINT explanations_pkey PRIMARY KEY (result_id, career_id, model);

--
-- Name: invites invites_code_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_code_hash_key UNIQUE (code_hash);

--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (student_id);

--
-- Name: market_data market_data_career_id_region_as_of_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_data
    ADD CONSTRAINT market_data_career_id_region_as_of_key UNIQUE (career_id, region, as_of);

--
-- Name: market_data market_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_data
    ADD CONSTRAINT market_data_pkey PRIMARY KEY (id);

--
-- Name: pairs pairs_parent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pairs
    ADD CONSTRAINT pairs_parent_id_key UNIQUE (parent_id);

--
-- Name: pairs pairs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pairs
    ADD CONSTRAINT pairs_pkey PRIMARY KEY (student_id);

--
-- Name: parent_domain_prefs parent_domain_prefs_parent_id_domain_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_domain_prefs
    ADD CONSTRAINT parent_domain_prefs_parent_id_domain_id_key UNIQUE (parent_id, domain_id);

--
-- Name: parent_domain_prefs parent_domain_prefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_domain_prefs
    ADD CONSTRAINT parent_domain_prefs_pkey PRIMARY KEY (parent_id, rank);

--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);

--
-- Name: questions questions_audience_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_audience_position_key UNIQUE (audience, "position");

--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);

--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (name);

--
-- Name: responses responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_pkey PRIMARY KEY (user_id, question_id);

--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);

--
-- Name: scholarship_careers scholarship_careers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_careers
    ADD CONSTRAINT scholarship_careers_pkey PRIMARY KEY (scholarship_id, career_id);

--
-- Name: scholarships scholarships_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarships
    ADD CONSTRAINT scholarships_name_key UNIQUE (name);

--
-- Name: scholarships scholarships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarships
    ADD CONSTRAINT scholarships_pkey PRIMARY KEY (id);

--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

--
-- Name: users users_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_role_key UNIQUE (id, role);

--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

--
-- Name: careers_domain_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX careers_domain_id_idx ON public.careers USING btree (domain_id);

--
-- Name: explanations_career_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX explanations_career_id_idx ON public.explanations USING btree (career_id);

--
-- Name: parent_domain_prefs_domain_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parent_domain_prefs_domain_id_idx ON public.parent_domain_prefs USING btree (domain_id);

--
-- Name: responses_question_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX responses_question_id_idx ON public.responses USING btree (question_id);

--
-- Name: results_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX results_parent_id_idx ON public.results USING btree (parent_id);

--
-- Name: results_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX results_student_id_idx ON public.results USING btree (student_id, created_at DESC);

--
-- Name: scholarship_careers_career_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scholarship_careers_career_id_idx ON public.scholarship_careers USING btree (career_id);

--
-- Name: profiles profiles_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

--
-- Name: careers careers_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.careers
    ADD CONSTRAINT careers_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE RESTRICT;

--
-- Name: courses courses_career_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_career_id_fkey FOREIGN KEY (career_id) REFERENCES public.careers(id) ON DELETE CASCADE;

--
-- Name: exams_colleges exams_colleges_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams_colleges
    ADD CONSTRAINT exams_colleges_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

--
-- Name: explanations explanations_career_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.explanations
    ADD CONSTRAINT explanations_career_id_fkey FOREIGN KEY (career_id) REFERENCES public.careers(id) ON DELETE CASCADE;

--
-- Name: explanations explanations_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.explanations
    ADD CONSTRAINT explanations_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.results(id) ON DELETE CASCADE;

--
-- Name: invites invites_student_id_student_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_student_id_student_role_fkey FOREIGN KEY (student_id, student_role) REFERENCES public.users(id, role) ON DELETE CASCADE;

--
-- Name: market_data market_data_career_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_data
    ADD CONSTRAINT market_data_career_id_fkey FOREIGN KEY (career_id) REFERENCES public.careers(id) ON DELETE CASCADE;

--
-- Name: pairs pairs_parent_id_parent_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pairs
    ADD CONSTRAINT pairs_parent_id_parent_role_fkey FOREIGN KEY (parent_id, parent_role) REFERENCES public.users(id, role) ON DELETE CASCADE;

--
-- Name: pairs pairs_student_id_student_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pairs
    ADD CONSTRAINT pairs_student_id_student_role_fkey FOREIGN KEY (student_id, student_role) REFERENCES public.users(id, role) ON DELETE CASCADE;

--
-- Name: parent_domain_prefs parent_domain_prefs_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_domain_prefs
    ADD CONSTRAINT parent_domain_prefs_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE RESTRICT;

--
-- Name: parent_domain_prefs parent_domain_prefs_parent_id_parent_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_domain_prefs
    ADD CONSTRAINT parent_domain_prefs_parent_id_parent_role_fkey FOREIGN KEY (parent_id, parent_role) REFERENCES public.users(id, role) ON DELETE CASCADE;

--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

--
-- Name: responses responses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

--
-- Name: responses responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

--
-- Name: results results_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;

--
-- Name: results results_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;

--
-- Name: scholarship_careers scholarship_careers_career_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_careers
    ADD CONSTRAINT scholarship_careers_career_id_fkey FOREIGN KEY (career_id) REFERENCES public.careers(id) ON DELETE CASCADE;

--
-- Name: scholarship_careers scholarship_careers_scholarship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_careers
    ADD CONSTRAINT scholarship_careers_scholarship_id_fkey FOREIGN KEY (scholarship_id) REFERENCES public.scholarships(id) ON DELETE CASCADE;

--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: careers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: domains; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

--
-- Name: exams_colleges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exams_colleges ENABLE ROW LEVEL SECURITY;

--
-- Name: explanations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;

--
-- Name: invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

--
-- Name: market_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

--
-- Name: pairs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;

--
-- Name: parent_domain_prefs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parent_domain_prefs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- Name: regions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

--
-- Name: responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

--
-- Name: results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

--
-- Name: scholarship_careers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scholarship_careers ENABLE ROW LEVEL SECURITY;

--
-- Name: scholarships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--
