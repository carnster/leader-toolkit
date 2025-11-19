-- Add facilitator_id foreign key to pd_activities to link to team members
ALTER TABLE pd_activities
ADD COLUMN facilitator_id UUID REFERENCES initiative_team_members(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_pd_activities_facilitator_id ON pd_activities(facilitator_id);

COMMENT ON COLUMN pd_activities.facilitator_id IS 'Links to initiative_team_members table for team member who facilitates this PD activity';