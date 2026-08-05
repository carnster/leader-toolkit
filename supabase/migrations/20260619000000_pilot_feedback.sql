-- Pilot feedback log: lightweight in-app feedback from users piloting the toolkit.
CREATE TABLE IF NOT EXISTS public.pilot_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid(),
  email       text,
  category    text NOT NULL DEFAULT 'other'
              CHECK (category IN ('bug', 'idea', 'confusing', 'praise', 'other')),
  message     text NOT NULL,
  page_path   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pilot_feedback ENABLE ROW LEVEL SECURITY;

-- Any signed-in user may submit their own feedback...
CREATE POLICY "users submit own feedback" ON public.pilot_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ...and see what they submitted. (Aggregate review is done by the team via
-- the service role / dashboard, not exposed to pilot users.)
CREATE POLICY "users read own feedback" ON public.pilot_feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created ON public.pilot_feedback (created_at DESC);
