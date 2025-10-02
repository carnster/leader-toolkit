-- Create observation_schedules table for planning observations
CREATE TABLE public.observation_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  active_ingredient_id uuid REFERENCES public.active_ingredients(id) ON DELETE SET NULL,
  observer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  implementer_id uuid,
  scheduled_date date NOT NULL,
  scheduled_time time,
  duration_minutes integer,
  observation_type text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  location text,
  notes text,
  completed_observation_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create fidelity_checklists table for customizable observation forms
CREATE TABLE public.fidelity_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  active_ingredient_id uuid REFERENCES public.active_ingredients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  checklist_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating_scale jsonb NOT NULL DEFAULT '{"min": 1, "max": 5, "labels": ["Not Observed", "Emerging", "Developing", "Proficient", "Exemplary"]}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add additional fields to existing fidelity_logs table
ALTER TABLE public.fidelity_logs 
ADD COLUMN IF NOT EXISTS schedule_id uuid REFERENCES public.observation_schedules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES public.fidelity_checklists(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS checklist_responses jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS evidence_photos text[],
ADD COLUMN IF NOT EXISTS duration_minutes integer,
ADD COLUMN IF NOT EXISTS location text;

-- Enable RLS on new tables
ALTER TABLE public.observation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for observation_schedules
CREATE POLICY "Users can view observation schedules for their initiatives"
ON public.observation_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = observation_schedules.initiative_id
    AND (
      auth.uid() = initiatives.owner_id
      OR EXISTS (
        SELECT 1 FROM public.initiative_team_members
        WHERE initiative_team_members.initiative_id = initiatives.id
        AND initiative_team_members.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can manage observation schedules for their initiatives"
ON public.observation_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = observation_schedules.initiative_id
    AND auth.uid() = initiatives.owner_id
  )
);

-- RLS Policies for fidelity_checklists
CREATE POLICY "Users can view fidelity checklists for their initiatives"
ON public.fidelity_checklists
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = fidelity_checklists.initiative_id
    AND (
      auth.uid() = initiatives.owner_id
      OR EXISTS (
        SELECT 1 FROM public.initiative_team_members
        WHERE initiative_team_members.initiative_id = initiatives.id
        AND initiative_team_members.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can manage fidelity checklists for their initiatives"
ON public.fidelity_checklists
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = fidelity_checklists.initiative_id
    AND auth.uid() = initiatives.owner_id
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_observation_schedules_updated_at
BEFORE UPDATE ON public.observation_schedules
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_fidelity_checklists_updated_at
BEFORE UPDATE ON public.fidelity_checklists
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.observation_schedules IS 'Scheduled fidelity observations with assignments and tracking';
COMMENT ON TABLE public.fidelity_checklists IS 'Customizable observation forms for fidelity monitoring';
COMMENT ON COLUMN public.observation_schedules.status IS 'Status: scheduled, in_progress, completed, cancelled';
COMMENT ON COLUMN public.observation_schedules.observation_type IS 'Type: direct_observation, self_report, artifact_review, coaching_note';