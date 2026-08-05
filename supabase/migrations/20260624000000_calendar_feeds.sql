-- calendar_feeds: a subscribable, read-only calendar URL per initiative.
--
-- The .ics download already works, but it is a snapshot: add a milestone
-- tomorrow and yesterday's download is stale, and re-importing duplicates every
-- event. A subscription URL is polled by Google/Apple/Outlook on their own
-- schedule, so the leader's calendar follows the plan instead of a copy of it.
--
-- Modeled on pulse_links: opaque token, revocable, rotatable. The difference is
-- direction. A pulse link accepts writes and returns nothing; a calendar feed
-- returns data and accepts nothing. That makes the token read-sensitive, so the
-- feed exposes only what a staff member with the link would already be told:
-- event titles, dates, and owner names. No commitment details, no notes.
CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_by    uuid NOT NULL DEFAULT auth.uid(),
  revoked       boolean NOT NULL DEFAULT false,
  last_fetched  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or team manages calendar feeds" ON public.calendar_feeds
  FOR ALL
  USING (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  )
  WITH CHECK (
    public.is_initiative_team_member(initiative_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_calendar_feeds_initiative
  ON public.calendar_feeds (initiative_id) WHERE NOT revoked;
