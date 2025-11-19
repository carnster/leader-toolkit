-- Add team member assignment fields to planning components

-- Add assigned_to field to communication_activities
ALTER TABLE communication_activities
ADD COLUMN assigned_to_id uuid REFERENCES initiative_team_members(id) ON DELETE SET NULL;

CREATE INDEX idx_communication_activities_assigned_to ON communication_activities(assigned_to_id);

-- Add owner field to timeline_milestones
ALTER TABLE timeline_milestones
ADD COLUMN owner_id uuid REFERENCES initiative_team_members(id) ON DELETE SET NULL;

CREATE INDEX idx_timeline_milestones_owner ON timeline_milestones(owner_id);

-- Add responsible_party_id to implementation_strategies (keeping responsible_party for backward compatibility)
ALTER TABLE implementation_strategies
ADD COLUMN responsible_party_id uuid REFERENCES initiative_team_members(id) ON DELETE SET NULL;

CREATE INDEX idx_implementation_strategies_responsible_party ON implementation_strategies(responsible_party_id);

-- Update implementation_risks owner_id to reference team members (currently just a string)
-- First, we need to drop the existing owner_id column and recreate it as a foreign key
ALTER TABLE implementation_risks
DROP COLUMN IF EXISTS owner_id;

ALTER TABLE implementation_risks
ADD COLUMN owner_id uuid REFERENCES initiative_team_members(id) ON DELETE SET NULL;

CREATE INDEX idx_implementation_risks_owner ON implementation_risks(owner_id);