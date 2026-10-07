# PRISM Engine database (PostgreSQL on Supabase)

Snehank owns db/ since Joel left on 2026-10-07. Rules for everything under db/ (how to run it: db/README.md):

- db/migrations/*.sql are the source of truth, applied in number order. Never edit a migration that has run on
  the hosted database; add the next number. db/schema.sql is generated: python db/scripts/check_db.py --write.
- Write for PostgreSQL 15 (Supabase). Assume only what Supabase provides (auth.users and the anon, authenticated
  and service_role roles); db/tests/supabase_shim.sql stands in for them in tests and must never run on Supabase.
- RLS is on for every table and the browser roles get no grants: the browser only talks to our API and the
  backend connects as the table owner. Never add a policy or a grant without asking Snehank.
- Money is the rupees domain (whole rupees). States use region_name / indian_state, trait keys come from
  trait_groups(), and categories, genders and roles have their own domains. backend/tests/test_db_consistency.py
  checks them against the backend's enums.
- Every real-world figure has source, source_url and as_of, or estimated = true. Never invent a number or a
  source: ask. Mark unchecked figures estimated.
- Seeds can be re-run: fixed ids or natural keys with ON CONFLICT ... DO UPDATE.
- Every schema or seed change: python db/scripts/check_db.py --write, then commit db/schema.sql with it.
- Add a db/tests/*.sql check for each new rule (pg_temp.expect_error in tests/_helpers.sql).
