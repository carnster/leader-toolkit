-- Add archived column to indicators table
ALTER TABLE public.indicators 
ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Add index for better query performance on archived indicators
CREATE INDEX idx_indicators_archived ON public.indicators(archived);

-- Update RLS policies to exclude archived indicators from normal queries
DROP POLICY IF EXISTS "Users can view indicators for their initiatives" ON public.indicators;

CREATE POLICY "Users can view indicators for their initiatives"
ON public.indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM initiatives
    WHERE initiatives.id = indicators.initiative_id
    AND (
      auth.uid() = initiatives.owner_id
      OR EXISTS (
        SELECT 1 FROM initiative_team_members
        WHERE initiative_team_members.initiative_id = initiatives.id
        AND initiative_team_members.user_id = auth.uid()
      )
    )
  )
);