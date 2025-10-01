-- Create timeline milestones table
CREATE TABLE public.timeline_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  milestone TEXT NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'at_risk')),
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create implementation risks table
CREATE TABLE public.implementation_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  risk_description TEXT NOT NULL,
  risk_category TEXT NOT NULL,
  likelihood TEXT NOT NULL CHECK (likelihood IN ('low', 'medium', 'high')),
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
  mitigation_strategy TEXT NOT NULL,
  contingency_plan TEXT,
  owner_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'realized')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professional development activities table
CREATE TABLE public.pd_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('initial_training', 'ongoing_coaching', 'collaborative_learning', 'external_workshop', 'self_directed')),
  title TEXT NOT NULL,
  description TEXT,
  facilitator TEXT,
  target_audience TEXT[],
  scheduled_date DATE,
  duration_minutes INTEGER,
  completion_status TEXT NOT NULL DEFAULT 'planned' CHECK (completion_status IN ('planned', 'completed', 'cancelled')),
  attendance_count INTEGER,
  fidelity_focus TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timeline_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementation_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pd_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timeline_milestones
CREATE POLICY "Users can manage milestones for their initiatives"
ON public.timeline_milestones
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = timeline_milestones.initiative_id
    AND auth.uid() = initiatives.owner_id
  )
);

CREATE POLICY "Users can view milestones for their initiatives"
ON public.timeline_milestones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = timeline_milestones.initiative_id
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

-- RLS Policies for implementation_risks
CREATE POLICY "Users can manage risks for their initiatives"
ON public.implementation_risks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = implementation_risks.initiative_id
    AND auth.uid() = initiatives.owner_id
  )
);

CREATE POLICY "Users can view risks for their initiatives"
ON public.implementation_risks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = implementation_risks.initiative_id
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

-- RLS Policies for pd_activities
CREATE POLICY "Users can manage PD activities for their initiatives"
ON public.pd_activities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = pd_activities.initiative_id
    AND auth.uid() = initiatives.owner_id
  )
);

CREATE POLICY "Users can view PD activities for their initiatives"
ON public.pd_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = pd_activities.initiative_id
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

-- Add updated_at triggers
CREATE TRIGGER update_timeline_milestones_updated_at
BEFORE UPDATE ON public.timeline_milestones
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_implementation_risks_updated_at
BEFORE UPDATE ON public.implementation_risks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_pd_activities_updated_at
BEFORE UPDATE ON public.pd_activities
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();