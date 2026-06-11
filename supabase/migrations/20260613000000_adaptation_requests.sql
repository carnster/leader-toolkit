-- Living Adaptation Protocol: proposed adaptations are checked against the
-- ingredient's boundaries, decided by the team, and logged for the scale decision.
CREATE TABLE IF NOT EXISTS adaptation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES active_ingredients(id) ON DELETE SET NULL,
  proposed_by uuid NOT NULL DEFAULT auth.uid(),
  description text NOT NULL,
  rationale text,
  touches_core boolean NOT NULL DEFAULT false,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','approved','approved_with_conditions','rejected')),
  decision_rationale text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE adaptation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view adaptations" ON adaptation_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_id
      AND (i.owner_id = auth.uid() OR is_initiative_team_member(i.id, auth.uid())))
  );
CREATE POLICY "Team can propose adaptations" ON adaptation_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_id
      AND (i.owner_id = auth.uid() OR is_initiative_team_member(i.id, auth.uid())))
  );
CREATE POLICY "Owners decide adaptations" ON adaptation_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  );
