-- The notification-generation functions are meant to run as cron/service-role
-- only, but Supabase's linter found them callable by anon and authenticated
-- via /rest/v1/rpc/. Revoke EXECUTE so no API caller can trigger them.
-- (Left untouched: the RLS helper functions is_initiative_team_member and
-- has_role, which the authenticated role must keep EXECUTE on for row-level
-- security to evaluate; and the trigger functions, which fire under the table
-- owner regardless of caller grants.)
-- Revoke from PUBLIC (the default grant anon/authenticated inherit) as well as
-- the API roles explicitly. service_role keeps EXECUTE for the cron job.
REVOKE EXECUTE ON FUNCTION public.create_milestone_notifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_observation_notifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_pd_notifications() FROM PUBLIC, anon, authenticated;
