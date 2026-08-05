-- Close the loop: commitments + coaching cycles.
--
-- The app collected signals that dead-ended: pulse needs_support flags rendered
-- as a count and went nowhere, and observation follow_up_actions were written
-- but never read back anywhere. A teacher who asks for help and hears nothing
-- stops asking. Commitments are the shared primitive that turns any signal
-- (pulse flag, observation follow-up, coaching next step, meeting action, or a
-- manual entry) into a small tracked promise: owner, due date, status, done.
--
-- Coaching cycles are the missing implementation driver on top of it. Training
-- alone transfers weakly to classroom practice; observation -> feedback -> one
-- agreed next step -> follow-up is the loop that moves practice (Joyce and
-- Showers). The agreed next step is recorded as a commitment, so the coaching
-- queue and the support queue are one list, not two.

CREATE TABLE IF NOT EXISTS public.commitments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id    uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  title            text NOT NULL,
  details          text,
  source           text NOT NULL DEFAULT 'manual'
                   CHECK (source IN ('manual','pulse','observation','coaching','meeting')),
  source_id        uuid,            -- polymorphic pointer back to the signal; no FK on purpose
  owner_member_id  uuid REFERENCES public.initiative_team_members(id) ON DELETE SET NULL,
  owner_name       text,            -- freeform when the owner is not a listed team member
  due_date         date,
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','dropped')),
  created_by       uuid NOT NULL DEFAULT auth.uid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz
);

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or team manages commitments" ON public.commitments
  FOR ALL
  USING (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  )
  WITH CHECK (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_commitments_initiative_status
  ON public.commitments (initiative_id, status);

CREATE TABLE IF NOT EXISTS public.coaching_cycles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id       uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  member_name         text NOT NULL,   -- who is being coached
  member_id           uuid REFERENCES public.initiative_team_members(id) ON DELETE SET NULL,
  focus_ingredient_id uuid REFERENCES public.active_ingredients(id) ON DELETE SET NULL,
  stage               text NOT NULL DEFAULT 'observation'
                      CHECK (stage IN ('observation','feedback','follow_up','closed')),
  observation_notes   text,
  observed_at         date,
  feedback_notes      text,
  next_step           text,
  commitment_id       uuid REFERENCES public.commitments(id) ON DELETE SET NULL,
  follow_up_date      date,
  outcome             text CHECK (outcome IN ('moved','partly','not_yet')),
  created_by          uuid NOT NULL DEFAULT auth.uid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  closed_at           timestamptz
);

ALTER TABLE public.coaching_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or team manages coaching cycles" ON public.coaching_cycles
  FOR ALL
  USING (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  )
  WITH CHECK (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_coaching_cycles_initiative_stage
  ON public.coaching_cycles (initiative_id, stage);
