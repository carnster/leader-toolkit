-- Add dependencies support to timeline_milestones
ALTER TABLE public.timeline_milestones 
ADD COLUMN depends_on uuid[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN public.timeline_milestones.depends_on IS 'Array of milestone IDs that must be completed before this milestone can begin';

-- Create index for better query performance on dependencies
CREATE INDEX idx_timeline_milestones_depends_on ON public.timeline_milestones USING GIN (depends_on);