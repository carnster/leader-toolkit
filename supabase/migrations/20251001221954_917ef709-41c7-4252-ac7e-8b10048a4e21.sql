-- Broaden access: owners OR existing team members can manage team members
-- Clean up previous specific policies
DROP POLICY IF EXISTS "Initiative owners can insert team members" ON public.initiative_team_members;
DROP POLICY IF EXISTS "Initiative owners can update team members" ON public.initiative_team_members;
DROP POLICY IF EXISTS "Initiative owners can delete team members" ON public.initiative_team_members;

-- INSERT
CREATE POLICY "Owners or team can insert team members"
ON public.initiative_team_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND (
        i.owner_id = auth.uid() OR public.is_initiative_team_member(i.id, auth.uid())
      )
  )
);

-- UPDATE
CREATE POLICY "Owners or team can update team members"
ON public.initiative_team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND (
        i.owner_id = auth.uid() OR public.is_initiative_team_member(i.id, auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND (
        i.owner_id = auth.uid() OR public.is_initiative_team_member(i.id, auth.uid())
      )
  )
);

-- DELETE
CREATE POLICY "Owners or team can delete team members"
ON public.initiative_team_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_team_members.initiative_id
      AND (
        i.owner_id = auth.uid() OR public.is_initiative_team_member(i.id, auth.uid())
      )
  )
);
