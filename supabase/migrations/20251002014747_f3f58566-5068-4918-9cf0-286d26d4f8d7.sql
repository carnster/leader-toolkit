-- Add sub_stage column to timeline_milestones for tracking Implement sub-stages
ALTER TABLE timeline_milestones 
ADD COLUMN sub_stage text;

-- Add a comment to document the sub_stage values
COMMENT ON COLUMN timeline_milestones.sub_stage IS 'Sub-stage for Implement phase: Emerging (0-25%), Developing (26-50%), Established (51-75%), Embedded (76-100%)';