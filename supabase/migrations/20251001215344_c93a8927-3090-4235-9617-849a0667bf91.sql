-- Fix RLS policies for decision_briefs to properly handle INSERT operations
-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage decision briefs for their initiatives" ON public.decision_briefs;
DROP POLICY IF EXISTS "Users can view decision briefs for their initiatives" ON public.decision_briefs;

-- Create new policies with explicit WITH CHECK for INSERT operations
CREATE POLICY "Users can insert decision briefs for their initiatives"
ON public.decision_briefs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = decision_briefs.initiative_id
    AND initiatives.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update decision briefs for their initiatives"
ON public.decision_briefs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = decision_briefs.initiative_id
    AND initiatives.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = decision_briefs.initiative_id
    AND initiatives.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete decision briefs for their initiatives"
ON public.decision_briefs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = decision_briefs.initiative_id
    AND initiatives.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view decision briefs for their initiatives"
ON public.decision_briefs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = decision_briefs.initiative_id
    AND (
      initiatives.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.initiative_team_members
        WHERE initiative_team_members.initiative_id = initiatives.id
        AND initiative_team_members.user_id = auth.uid()
      )
    )
  )
);