-- Helpers for the db tests, included by each test_*.sql with \ir. They live in pg_temp, so they vanish when
-- the test's session ends and never reach a real database.

-- Run a statement that must fail with the given SQLSTATE, e.g. '23514' (a CHECK failed),
-- '23503' (a foreign key failed), '23505' (a duplicate), '42501' (permission denied).
CREATE FUNCTION pg_temp.expect_error(statement TEXT, expected_sqlstate TEXT) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE statement;
    EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE <> expected_sqlstate THEN
            RAISE EXCEPTION 'expected error % but got % (%) from: %', expected_sqlstate, SQLSTATE, SQLERRM, statement;
        END IF;
        RETURN;
    END;
    RAISE EXCEPTION 'expected error % but this succeeded: %', expected_sqlstate, statement;
END $$;

-- Sign someone up the way Supabase Auth does: insert into auth.users and let handle_new_user() run.
CREATE FUNCTION pg_temp.sign_up(signup_role TEXT, email TEXT) RETURNS UUID
LANGUAGE sql AS $$
    INSERT INTO auth.users (email, raw_user_meta_data)
    VALUES (email, jsonb_build_object('role', signup_role, 'full_name', 'Test ' || signup_role))
    RETURNING id
$$;
