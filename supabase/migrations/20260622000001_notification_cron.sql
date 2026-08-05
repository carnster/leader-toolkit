-- Drift alerts: make the notification system actually fire.
--
-- The database has had notification-generating functions since November
-- (create_milestone_notifications, create_observation_notifications,
-- create_pd_notifications) but NOTHING ever called them: no client code, no
-- scheduler. The bell icon only ever showed manually created rows. Classic
-- monitoring failure: nothing tells the leader it is slipping until they go
-- look.
--
-- This migration (1) adds the missing drift case, milestones that are past
-- due (the existing function only fires exactly 7 days before the deadline),
-- and (2) schedules all of it daily with pg_cron, in-database, no external
-- dependency.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Notify the initiative owner ONCE when a milestone first shows up overdue.
-- Deduped against any prior overdue notification for the same milestone, so
-- it does not nag daily; the meeting brief carries the standing list.
CREATE OR REPLACE FUNCTION public.create_overdue_milestone_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, initiative_id, type, title, message, action_url)
  SELECT
    i.owner_id,
    tm.initiative_id,
    'milestone_overdue',
    'Milestone Overdue',
    'Milestone "' || tm.milestone || '" was due ' || to_char(tm.target_date, 'Mon DD') || ' and is not complete',
    '/plan?initiative=' || tm.initiative_id || '&section=execution'
  FROM public.timeline_milestones tm
  JOIN public.initiatives i ON i.id = tm.initiative_id
  WHERE tm.status != 'completed'
    AND tm.target_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.initiative_id = tm.initiative_id
        AND n.type = 'milestone_overdue'
        AND n.message LIKE '%"' || tm.milestone || '"%'
    );
END;
$$;

-- Daily tick at 12:05 UTC (just after the keep-alive ping). cron.schedule
-- with a job name is an upsert, so re-running this migration is safe.
SELECT cron.schedule(
  'daily-notification-tick',
  '5 12 * * *',
  $$
    SELECT public.create_milestone_notifications();
    SELECT public.create_overdue_milestone_notifications();
    SELECT public.create_observation_notifications();
    SELECT public.create_pd_notifications();
  $$
);
