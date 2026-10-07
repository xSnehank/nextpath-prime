-- =============================================================================
-- Migration 003: a sign-up without a valid role is rejected with a clear message.
--
-- The choice left open in 001's TODO. Rejecting is the safe option: defaulting to 'student' could silently
-- turn a parent into a student, and skipping the users row would leave an account that can't do anything.
-- The frontend always sends options.data.role, so only a broken or hand-made sign-up hits this.
-- CREATE OR REPLACE keeps the function's privileges, so 002's REVOKE still applies.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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
