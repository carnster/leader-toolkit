-- Add goals field to decision_briefs table
ALTER TABLE public.decision_briefs 
  ADD COLUMN IF NOT EXISTS goals TEXT;

-- Add AI feedback field for goals
ALTER TABLE public.decision_briefs 
  ADD COLUMN IF NOT EXISTS goals_feedback JSONB;