-- Team meeting log: the book's meeting protocol made operational. Each meeting
-- records decisions with owners and the three behaviors (Engage, Unite, Reflect).
CREATE TABLE IF NOT EXISTS team_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  meeting_date date NOT NULL DEFAULT CURRENT_DATE,
  attendees text[] DEFAULT '{}',
  engage_notes text,
  unite_notes text,
  reflect_notes text,
  decisions text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE team_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view meetings" ON team_meetings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_id
      AND (i.owner_id = auth.uid() OR is_initiative_team_member(i.id, auth.uid())))
  );
CREATE POLICY "Team can log meetings" ON team_meetings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_id
      AND (i.owner_id = auth.uid() OR is_initiative_team_member(i.id, auth.uid())))
  );
CREATE POLICY "Authors update their meetings" ON team_meetings
  FOR UPDATE USING (created_by = auth.uid());
