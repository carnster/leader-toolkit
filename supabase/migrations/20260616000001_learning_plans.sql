-- A collective, year-long professional learning plan synthesized across one or
-- more initiatives. Owner-only, like the rest of a leader's planning data.
CREATE TABLE IF NOT EXISTS public.learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  scope text NOT NULL DEFAULT 'all' CHECK (scope IN ('single', 'all')),
  initiative_ids uuid[] NOT NULL DEFAULT '{}',
  school_year_start text,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their learning plans"
  ON public.learning_plans FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners create their learning plans"
  ON public.learning_plans FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update their learning plans"
  ON public.learning_plans FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete their learning plans"
  ON public.learning_plans FOR DELETE USING (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_learning_plans_owner ON public.learning_plans (owner_id, created_at DESC);
