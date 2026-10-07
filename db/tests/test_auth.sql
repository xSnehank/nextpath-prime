-- Signing up through Supabase Auth creates the matching users row (handle_new_user).
\ir _helpers.sql
BEGIN;

DO $$
DECLARE
    student UUID;
    parent  UUID;
    unnamed UUID;
BEGIN
    student := pg_temp.sign_up('student', 'student@test.local');
    parent  := pg_temp.sign_up('parent', 'parent@test.local');

    ASSERT (SELECT role FROM users WHERE id = student) = 'student', 'a student sign-up creates a student';
    ASSERT (SELECT role FROM users WHERE id = parent) = 'parent', 'a parent sign-up creates a parent';
    ASSERT (SELECT email FROM users WHERE id = student) = 'student@test.local', 'the email is copied';
    ASSERT (SELECT full_name FROM users WHERE id = student) = 'Test student', 'the name is copied';

    INSERT INTO auth.users (email, raw_user_meta_data)
    VALUES ('unnamed@test.local', '{"role": "student", "full_name": "   "}')
    RETURNING id INTO unnamed;
    ASSERT (SELECT full_name FROM users WHERE id = unnamed) IS NULL, 'a blank name is stored as NULL';

    -- a sign-up with no role, or a made-up one, is rejected instead of creating a wrong account
    PERFORM pg_temp.expect_error($q$INSERT INTO auth.users (email, raw_user_meta_data)
        VALUES ('norole@test.local', '{"full_name": "No Role"}')$q$, '23514');
    PERFORM pg_temp.expect_error($q$INSERT INTO auth.users (email, raw_user_meta_data)
        VALUES ('admin@test.local', '{"role": "admin"}')$q$, '23514');
    ASSERT NOT EXISTS (SELECT 1 FROM users WHERE email IN ('norole@test.local', 'admin@test.local')),
           'a rejected sign-up leaves no users row';

    DELETE FROM auth.users WHERE id = student;
    ASSERT NOT EXISTS (SELECT 1 FROM users WHERE id = student), 'deleting the account deletes the users row';
END $$;

ROLLBACK;
