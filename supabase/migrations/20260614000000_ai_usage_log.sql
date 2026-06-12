-- Per-user AI request log for rate limiting. Written only by edge functions
-- via the service role; no client access.
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role reads or writes this table.

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_fn_time
  ON public.ai_usage_log (user_id, function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time
  ON public.ai_usage_log (user_id, created_at DESC);
