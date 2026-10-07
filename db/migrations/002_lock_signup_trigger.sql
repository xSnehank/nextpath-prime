-- =============================================================================
-- Migration 002: nobody can call handle_new_user() through the API.
--
-- Supabase's security advisor flagged that anon and authenticated could reach this SECURITY DEFINER function
-- at /rest/v1/rpc/handle_new_user. Postgres refuses to run a trigger function outside a trigger, but the
-- function shouldn't be exposed at all. The sign-up trigger keeps working: Postgres checks EXECUTE only when
-- a trigger is created, not each time it fires.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
