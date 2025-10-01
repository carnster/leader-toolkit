-- Fix RLS for inserting/updating/deleting initiative team members
-- Drop overly broad ALL policy lacking WITH CHECK
DROP POLICY IF EXISTS "Initiative owners can manage team members" ON public.initiative_team_members;

-- Allow initiative owners to INSERT team members
CREATE POLICY "Initiative owners can insert team members"
ON public.initiative_team_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND i.owner_id = auth.uid()
  )
);

-- Allow initiative owners to UPDATE team members
CREATE POLICY "Initiative owners can update team members"
ON public.initiative_team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND i.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND i.owner_id = auth.uid()
  )
);

-- Allow initiative owners to DELETE team members
CREATE POLICY "Initiative owners can delete team members"
ON public.initiative_team_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND i.owner_id = auth.uid()
  )
);
