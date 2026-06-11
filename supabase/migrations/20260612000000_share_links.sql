-- Read-only share links: a tokenized public view of an initiative's brief and plan.
CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked boolean NOT NULL DEFAULT false
);
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their share links" ON share_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_id AND i.owner_id = auth.uid())
  );
