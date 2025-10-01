-- Add individual feasibility factors to decision_briefs
ALTER TABLE public.decision_briefs 
  ADD COLUMN IF NOT EXISTS feasibility_factors JSONB DEFAULT '{}'::jsonb;