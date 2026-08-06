-- Red-team remediation, database layer. Four fixes in one migration because
-- they ship together to both deployments.
--
-- 1. TEAM WRITE ACCESS. Thirteen collaborative tables were writable by the
--    initiative owner alone, while the UI showed every team member enabled
--    add/edit buttons that failed with raw RLS errors. The product's own newer
--    features (commitments, coaching cycles, pulse links) already use
--    owner-or-team writes; this brings the older tables to the same standard.
--    Roster management and the initiative row itself stay owner-only.
--
-- 2. PULSE PSEUDONYMITY. The public pulse page promises "leave blank to stay
--    anonymous," but client_key (the per-browser dedupe token) was readable by
--    any team member via the API, letting a determined reader link one
--    anonymous respondent's answers across weeks. Column-level grants now keep
--    client_key server-side only.
--
-- 3. INVITES. Adding a team member by name granted nothing. An optional
--    invited_email now links the roster row to the real account automatically
--    on that person's first login, via a SECURITY DEFINER RPC keyed to
--    auth.email().
--
-- 4. ALERTS. Overdue commitments notified nobody (the loop-closing primitive
--    relied on someone opening the app), and pulse drift was invisible. Both
--    now feed the daily tick, and a per-user preferences table lets any
--    notification type be switched off; enforcement is a BEFORE INSERT trigger
--    so every current and future generator respects it automatically.

-- ============ 1. Team write access ============
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'active_ingredients','timeline_milestones','implementation_risks',
    'pd_activities','budget_items','time_commitments','indicators',
    'pdsa_cycles','sustainability_plans','implementation_strategies',
    'communication_activities','observation_schedules','fidelity_checklists'
  ] LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND cmd = 'ALL'
        AND qual LIKE '%owner_id%' AND qual NOT LIKE '%is_initiative_team_member%'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL
       USING (
         public.is_initiative_team_member(initiative_id, auth.uid())
         OR EXISTS (SELECT 1 FROM public.initiatives i
                    WHERE i.id = initiative_id AND i.owner_id = auth.uid())
       )
       WITH CHECK (
         public.is_initiative_team_member(initiative_id, auth.uid())
         OR EXISTS (SELECT 1 FROM public.initiatives i
                    WHERE i.id = initiative_id AND i.owner_id = auth.uid())
       )',
      'owner or team manages ' || t, t
    );
  END LOOP;
END $$;

-- ============ 2. Pulse pseudonymity ============
REVOKE SELECT ON public.pulse_checkins FROM authenticated, anon;
GRANT SELECT (
  id, initiative_id, respondent_id, respondent_name, week_of,
  focus_ingredient_id, used_status, traction, needs_support,
  created_at, updated_at, via_link_id
) ON public.pulse_checkins TO authenticated;

-- ============ 3. Invites ============
ALTER TABLE public.initiative_team_members
  ADD COLUMN IF NOT EXISTS invited_email text;

CREATE OR REPLACE FUNCTION public.link_team_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;
  UPDATE public.initiative_team_members
  SET user_id = auth.uid()
  WHERE user_id IS NULL
    AND invited_email IS NOT NULL
    AND lower(invited_email) = lower(coalesce(auth.email(), ''));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.link_team_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_team_invites() TO authenticated;

-- ============ 4a. Notification preferences ============
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  type    text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, type)
);
ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own notification prefs" ON public.user_notification_prefs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notifications_respect_prefs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_notification_prefs p
    WHERE p.user_id = NEW.user_id AND p.type = NEW.type AND NOT p.enabled
  ) THEN
    RETURN NULL;  -- silently suppress: the user turned this type off
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_respect_prefs ON public.notifications;
CREATE TRIGGER notifications_respect_prefs
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_respect_prefs();

-- ============ 4b. Overdue commitments ============
CREATE OR REPLACE FUNCTION public.create_overdue_commitment_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, initiative_id, type, title, message, action_url)
  SELECT
    i.owner_id,
    c.initiative_id,
    'commitment_overdue',
    'Commitment Overdue',
    'Commitment "' || c.title || '"'
      || CASE WHEN c.owner_name IS NOT NULL THEN ' (' || c.owner_name || ')' ELSE '' END
      || ' was due ' || to_char(c.due_date, 'Mon DD') || ' and is still open',
    '/implement?initiative=' || c.initiative_id || '&commitment=' || c.id
  FROM public.commitments c
  JOIN public.initiatives i ON i.id = c.initiative_id
  WHERE c.status = 'open'
    AND c.due_date IS NOT NULL
    AND c.due_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.initiative_id = c.initiative_id
        AND n.type = 'commitment_overdue'
        AND n.action_url LIKE '%commitment=' || c.id::text
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_overdue_commitment_notifications() FROM PUBLIC, anon, authenticated;

-- ============ 4c. Pulse drift ============
CREATE OR REPLACE FUNCTION public.create_pulse_drift_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_week date := date_trunc('week', (now() AT TIME ZONE 'utc'))::date;
BEGIN
  INSERT INTO public.notifications (user_id, initiative_id, type, title, message, action_url)
  SELECT
    i.owner_id,
    s.initiative_id,
    'pulse_drift',
    'Pulse Drift',
    'Average traction dropped from ' || round(s.prev_avg, 1) || ' to ' || round(s.cur_avg, 1)
      || ' this week (' || s.cur_n || ' responses). Worth a look before it compounds.',
    '/implement?initiative=' || s.initiative_id || '&pulse-drift=' || cur_week
  FROM (
    SELECT
      initiative_id,
      avg(traction) FILTER (WHERE week_of = cur_week)      AS cur_avg,
      count(*)      FILTER (WHERE week_of = cur_week)      AS cur_n,
      avg(traction) FILTER (WHERE week_of = cur_week - 7)  AS prev_avg,
      count(*)      FILTER (WHERE week_of = cur_week - 7)  AS prev_n
    FROM public.pulse_checkins
    WHERE week_of IN (cur_week, cur_week - 7)
    GROUP BY initiative_id
  ) s
  JOIN public.initiatives i ON i.id = s.initiative_id
  WHERE s.cur_n >= 3 AND s.prev_n >= 3
    AND s.prev_avg - s.cur_avg >= 1.0
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.initiative_id = s.initiative_id
        AND n.type = 'pulse_drift'
        AND n.action_url LIKE '%pulse-drift=' || cur_week::text
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_pulse_drift_notifications() FROM PUBLIC, anon, authenticated;

-- ============ 4d. Fold both into the daily tick ============
DO $$
BEGIN
  PERFORM cron.unschedule('daily-notification-tick');
EXCEPTION WHEN OTHERS THEN
  NULL; -- not scheduled yet on this deployment
END $$;

SELECT cron.schedule(
  'daily-notification-tick',
  '5 12 * * *',
  $$
    SELECT public.create_milestone_notifications();
    SELECT public.create_overdue_milestone_notifications();
    SELECT public.create_observation_notifications();
    SELECT public.create_pd_notifications();
    SELECT public.create_overdue_commitment_notifications();
    SELECT public.create_pulse_drift_notifications();
  $$
);
