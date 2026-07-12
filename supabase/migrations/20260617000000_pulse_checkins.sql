-- pulse_checkins: one lightweight weekly self-report per implementer.
-- Fidelity is the leader observing; the pulse is the implementer speaking out.
CREATE TABLE IF NOT EXISTS public.pulse_checkins (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id       uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  respondent_id       uuid NOT NULL DEFAULT auth.uid(),
  respondent_name     text,
  week_of             date NOT NULL,                 -- Monday of the week
  focus_ingredient_id uuid REFERENCES public.active_ingredients(id) ON DELETE SET NULL,
  used_status         text NOT NULL CHECK (used_status IN ('yes', 'partly', 'not_yet')),
  traction            int  NOT NULL CHECK (traction BETWEEN 1 AND 4),
  needs_support       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- one pulse per person per initiative per week (upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS pulse_one_per_week
  ON public.pulse_checkins (initiative_id, respondent_id, week_of);

ALTER TABLE public.pulse_checkins ENABLE ROW LEVEL SECURITY;

-- read: any team member of the initiative sees its pulses
CREATE POLICY "team reads pulses" ON public.pulse_checkins
  FOR SELECT USING (public.is_initiative_team_member(initiative_id, auth.uid()));

-- insert: you may only submit your own, and only for your initiative
CREATE POLICY "member inserts own pulse" ON public.pulse_checkins
  FOR INSERT WITH CHECK (
    respondent_id = auth.uid()
    AND public.is_initiative_team_member(initiative_id, auth.uid())
  );

-- update: only your own row
CREATE POLICY "member updates own pulse" ON public.pulse_checkins
  FOR UPDATE USING (respondent_id = auth.uid())
  WITH CHECK (respondent_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pulse_initiative_week
  ON public.pulse_checkins (initiative_id, week_of DESC);
