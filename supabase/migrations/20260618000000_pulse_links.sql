-- pulse_links: a public, write-only link that lets any staff member send the
-- weekly pulse without an account. Modeled on share_links.
CREATE TABLE IF NOT EXISTS public.pulse_links (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  token                text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  active_ingredient_id uuid REFERENCES public.active_ingredients(id) ON DELETE SET NULL,
  created_by           uuid NOT NULL DEFAULT auth.uid(),
  expected_staff_count int,
  revoked              boolean NOT NULL DEFAULT false,
  expires_at           timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pulse_links ENABLE ROW LEVEL SECURITY;

-- only the owner or a team member manages an initiative's links
CREATE POLICY "owner or team manages pulse links" ON public.pulse_links
  FOR ALL
  USING (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  )
  WITH CHECK (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  );

-- link-sourced pulses have no account: tag them to the link and de-dupe per
-- browser via a client_key, and allow a null respondent_id.
ALTER TABLE public.pulse_checkins
  ADD COLUMN IF NOT EXISTS via_link_id uuid REFERENCES public.pulse_links(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_key text;

ALTER TABLE public.pulse_checkins ALTER COLUMN respondent_id DROP NOT NULL;

-- one pulse per anonymous browser per link per week.
-- Full (non-partial) index so the edge function's ON CONFLICT arbiter matches.
-- Account pulses have null via_link_id/client_key; nulls are distinct, so they
-- never collide here (they are deduped by pulse_one_per_week instead).
CREATE UNIQUE INDEX IF NOT EXISTS pulse_link_one_per_week
  ON public.pulse_checkins (via_link_id, client_key, week_of);
