-- The browser's roles (anon before sign-in, authenticated after) can't read or write any table.
-- Only the backend, connected as the table owner, can. On Supabase this is what keeps the public anon key
-- from exposing families' data through the REST API.
\ir _helpers.sql
BEGIN;

DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
    ), 'RLS is on for every table';
    ASSERT NOT EXISTS (
        SELECT 1 FROM pg_tables t, (VALUES ('anon'), ('authenticated')) AS r(role)
        WHERE t.schemaname = 'public'
          AND has_table_privilege(r.role, format('public.%I', t.tablename), 'SELECT, INSERT, UPDATE, DELETE')
    ), 'the browser roles have no privileges on any table';
END $$;

-- Prove it by trying, as each browser role.
SET LOCAL ROLE anon;
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        BEGIN
            EXECUTE format('SELECT 1 FROM public.%I LIMIT 1', t);
            RAISE EXCEPTION 'anon can read %', t;
        EXCEPTION WHEN insufficient_privilege THEN
            NULL;
        END;
    END LOOP;
END $$;

SET LOCAL ROLE authenticated;
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        BEGIN
            EXECUTE format('SELECT 1 FROM public.%I LIMIT 1', t);
            RAISE EXCEPTION 'authenticated can read %', t;
        EXCEPTION WHEN insufficient_privilege THEN
            NULL;
        END;
    END LOOP;
    BEGIN
        INSERT INTO public.domains (name, description) VALUES ('x', 'x');
        RAISE EXCEPTION 'authenticated can write domains';
    EXCEPTION WHEN insufficient_privilege THEN
        NULL;
    END;
END $$;

ROLLBACK;
