-- Broaden decision_briefs write access to initiative owners AND team members
-- Replace insert/update policies accordingly
DROP POLICY IF EXISTS "Users can insert decision briefs for their initiatives" ON public.decision_briefs;
DROP POLICY IF EXISTS "Users can update decision briefs for their initiatives" ON public.decision_briefs;

CREATE POLICY "Owners and team can insert decision briefs"
ON public.decision_briefs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = decision_briefs.initiative_id
      AND (
        i.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.initiative_team_members tm
          WHERE tm.initiative_id = i.id AND tm.user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "Owners and team can update decision briefs"
ON public.decision_briefs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = decision_briefs.initiative_id
      AND (
        i.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.initiative_team_members tm
          WHERE tm.initiative_id = i.id AND tm.user_id = auth.uid()
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = decision_briefs.initiative_id
      AND (
        i.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.initiative_team_members tm
          WHERE tm.initiative_id = i.id AND tm.user_id = auth.uid()
        )
      )
  )
);