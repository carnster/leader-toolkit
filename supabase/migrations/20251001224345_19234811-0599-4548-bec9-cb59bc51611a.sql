-- Allow team members without user accounts (name-only entries)
ALTER TABLE public.initiative_team_members 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add name field for team members who aren't users yet
ALTER TABLE public.initiative_team_members 
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Add constraint: must have either user_id or name
ALTER TABLE public.initiative_team_members 
  ADD CONSTRAINT user_id_or_name_required 
  CHECK (user_id IS NOT NULL OR name IS NOT NULL);