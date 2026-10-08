-- Streams and tiers (migration 004): the database refuses a bad stream, a course whose natural streams aren't
-- a subset of its eligible ones, a course listing 'undecided', and a tier outside 1-3.
\ir _helpers.sql
BEGIN;

DO $$
DECLARE
    student    UUID := pg_temp.sign_up('student', 'stream@test.local');
    any_career UUID := (SELECT id FROM careers ORDER BY name LIMIT 1);
    any_course UUID := (SELECT id FROM courses ORDER BY name LIMIT 1);
BEGIN
    -- the student's stream: one of the seven values, or NULL
    INSERT INTO profiles (user_id, stream) VALUES (student, 'science_pcm');
    UPDATE profiles SET stream = 'undecided' WHERE user_id = student;
    UPDATE profiles SET stream = NULL WHERE user_id = student;
    PERFORM pg_temp.expect_error(format('UPDATE profiles SET stream = %L WHERE user_id = %L', 'PCM', student), '23514');
    PERFORM pg_temp.expect_error(format('UPDATE profiles SET stream = %L WHERE user_id = %L', 'science', student), '23514');

    -- a course's streams: non-empty, primary within eligible, never 'undecided'
    PERFORM pg_temp.expect_error(format(
        'INSERT INTO courses (career_id, name, level, duration_years, eligible_streams, primary_streams) '
        'VALUES (%L, %L, %L, 3, %L, %L)', any_career, 'Test course A', 'UG', '{arts}', '{commerce}'), '23514');
    PERFORM pg_temp.expect_error(format(
        'INSERT INTO courses (career_id, name, level, duration_years, eligible_streams, primary_streams) '
        'VALUES (%L, %L, %L, 3, %L, %L)', any_career, 'Test course B', 'UG', '{}', '{}'), '23514');
    PERFORM pg_temp.expect_error(format(
        'INSERT INTO courses (career_id, name, level, duration_years, eligible_streams, primary_streams) '
        'VALUES (%L, %L, %L, 3, %L, %L)', any_career, 'Test course C', 'UG', '{arts,undecided}', '{arts}'), '23514');
    PERFORM pg_temp.expect_error(format(
        'INSERT INTO courses (career_id, name, level, duration_years, eligible_streams, primary_streams) '
        'VALUES (%L, %L, %L, 3, %L, %L)', any_career, 'Test course D', 'UG', '{arts,pcm}', '{arts}'), '23514');
    -- the streams are required: no default since 004
    PERFORM pg_temp.expect_error(format(
        'INSERT INTO courses (career_id, name, level, duration_years) VALUES (%L, %L, %L, 3)',
        any_career, 'Test course E', 'UG'), '23502');
    INSERT INTO courses (career_id, name, level, duration_years, eligible_streams, primary_streams)
    VALUES (any_career, 'Test course F', 'UG', 3, '{arts,commerce}', '{arts}');

    -- tier: 1, 2, 3 or NULL
    PERFORM pg_temp.expect_error(format(
        'INSERT INTO exams_colleges (course_id, exam, college, source, estimated, tier) '
        'VALUES (%L, %L, %L, %L, true, 4)', any_course, 'Test exam', 'Test college', 'test'), '23514');
    PERFORM pg_temp.expect_error(format(
        'INSERT INTO exams_colleges (course_id, exam, college, source, estimated, tier) '
        'VALUES (%L, %L, %L, %L, true, 0)', any_course, 'Test exam', 'Test college', 'test'), '23514');
    INSERT INTO exams_colleges (course_id, exam, college, source, estimated, tier)
    VALUES (any_course, 'Test exam', 'Test college', 'test', true, NULL);
END $$;

ROLLBACK;
