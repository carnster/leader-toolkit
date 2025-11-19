-- Extend fidelity_logs table to support different log types
ALTER TABLE fidelity_logs 
ADD COLUMN log_type text DEFAULT 'standard' 
  CHECK (log_type IN ('quick', 'detailed', 'team', 'standard'));

-- Add participants field for team check-ins
ALTER TABLE fidelity_logs 
ADD COLUMN participants jsonb DEFAULT '[]'::jsonb;

-- Add follow-up actions for coach observations
ALTER TABLE fidelity_logs 
ADD COLUMN follow_up_actions text[];

-- Add index for querying by log_type
CREATE INDEX idx_fidelity_logs_log_type ON fidelity_logs(log_type);

-- Update comment for clarity
COMMENT ON COLUMN fidelity_logs.log_type IS 'Type of fidelity observation: quick (60-second), detailed (coach observation), team (group check-in), or standard';
COMMENT ON COLUMN fidelity_logs.participants IS 'Array of team member IDs who participated in team check-ins';
COMMENT ON COLUMN fidelity_logs.follow_up_actions IS 'Action items identified during coach observations';