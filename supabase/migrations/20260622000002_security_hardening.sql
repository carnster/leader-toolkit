-- Hardening from the overnight security review of the commitments/coaching
-- and notification-cron work.
--
-- (1) HIGH: create_overdue_milestone_notifications missed the EXECUTE revoke
--     its three sibling functions got in 20260614000002. SECURITY DEFINER +
--     default PUBLIC grant meant any API caller could trigger the DB-wide
--     bulk write via /rest/v1/rpc/. Cron-only; nobody else may call it.
REVOKE EXECUTE ON FUNCTION public.create_overdue_milestone_notifications() FROM PUBLIC, anon, authenticated;

-- (2) MEDIUM: the overdue dedupe matched on the rendered message with LIKE,
--     so a milestone name containing % (e.g. "50% Enrollment Threshold")
--     wildcard-matched every prior notification and silently suppressed all
--     future overdue alerts for that initiative. Dedupe on the milestone id
--     instead: it now travels in action_url, and a uuid contains no LIKE
--     wildcards. (Pre-existing notifications lack the marker, so each
--     already-notified overdue milestone may notify once more. Acceptable.)
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
    '/plan?initiative=' || tm.initiative_id || '&section=execution&milestone=' || tm.id
  FROM public.timeline_milestones tm
  JOIN public.initiatives i ON i.id = tm.initiative_id
  WHERE tm.status != 'completed'
    AND tm.target_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.initiative_id = tm.initiative_id
        AND n.type = 'milestone_overdue'
        AND n.action_url LIKE '%milestone=' || tm.id::text
    );
END;
$$;

-- (3) LOW/MEDIUM: created_by had DEFAULT auth.uid() but nothing stopped a
--     direct PostgREST insert from attributing a row to someone else. A
--     trigger pins authorship server-side without touching the RLS policies
--     (adding created_by = auth.uid() to WITH CHECK would have broken
--     legitimate updates by other team members, since FOR ALL applies the
--     check to updates too).
CREATE OR REPLACE FUNCTION public.force_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS commitments_force_created_by ON public.commitments;
CREATE TRIGGER commitments_force_created_by
  BEFORE INSERT ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION public.force_created_by();

DROP TRIGGER IF EXISTS coaching_cycles_force_created_by ON public.coaching_cycles;
CREATE TRIGGER coaching_cycles_force_created_by
  BEFORE INSERT ON public.coaching_cycles
  FOR EACH ROW EXECUTE FUNCTION public.force_created_by();

-- (4) Correctness (from the adversarial review): the "already logged" check
--     for signal-sourced commitments lived only in the client cache, so two
--     tabs or a fast double-click could file the same pulse flag twice. The
--     database now enforces it. title is included because one observation
--     legitimately produces several commitments under one source_id. Plain
--     partial unique index: fine for INSERT dedupe (the earlier pulse-links
--     lesson about partial indexes applies only to ON CONFLICT arbiters,
--     which nothing here uses).
CREATE UNIQUE INDEX IF NOT EXISTS commitments_one_per_signal
  ON public.commitments (initiative_id, source, source_id, title)
  WHERE source_id IS NOT NULL;
