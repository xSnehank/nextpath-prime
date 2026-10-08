-- =============================================================================
-- Migration 004: the student's Class 11-12 stream, which streams each course accepts, and college tiers.
--
-- A student's stream decides which careers are open (a PCB student can't take B.Tech, which needs Maths) and
-- which come first (a PCM student sees engineering and science before CA or BBA). Backend guide section 4,
-- step 0. 'undecided' is for a Class 10 student who hasn't chosen yet; courses never list it.
--
-- Tier: 1 = NIRF top 50 in its category (top 20 for Medical, Dental, Law, Architecture), 2 = ranked lower or
-- a national institute NIRF doesn't rank, 3 = not NIRF-ranked. NULL for routes that aren't colleges (the
-- professional bodies and NDA). db/scripts/build_catalog.py computes it.
-- =============================================================================

CREATE DOMAIN school_stream AS TEXT CHECK (VALUE IN (
    'science_pcm', 'science_pcb', 'science_pcmb', 'commerce_maths', 'commerce', 'arts', 'undecided'
));

-- Students only; the API requires it in PUT /profile. Parents leave it NULL.
ALTER TABLE profiles ADD COLUMN stream school_stream;

-- Existing rows get every stream so the NOT NULL holds; the catalog seed then sets the real values.
ALTER TABLE courses
    ADD COLUMN eligible_streams school_stream[] NOT NULL
        DEFAULT '{science_pcm,science_pcb,science_pcmb,commerce_maths,commerce,arts}',
    ADD COLUMN primary_streams school_stream[] NOT NULL
        DEFAULT '{science_pcm,science_pcb,science_pcmb,commerce_maths,commerce,arts}';
ALTER TABLE courses
    ALTER COLUMN eligible_streams DROP DEFAULT,
    ALTER COLUMN primary_streams DROP DEFAULT,
    ADD CONSTRAINT courses_eligible_streams_check
        CHECK (cardinality(eligible_streams) > 0 AND NOT ('undecided' = ANY (eligible_streams))),
    ADD CONSTRAINT courses_primary_streams_check
        CHECK (cardinality(primary_streams) > 0 AND primary_streams <@ eligible_streams);

ALTER TABLE exams_colleges ADD COLUMN tier SMALLINT CHECK (tier BETWEEN 1 AND 3);
