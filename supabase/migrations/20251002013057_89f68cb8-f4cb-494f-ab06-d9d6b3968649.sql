-- Create table for communication activities
CREATE TABLE public.communication_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  stakeholder_group TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  channel TEXT,
  scheduled_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage communication activities for their initiatives"
  ON public.communication_activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = communication_activities.initiative_id
      AND initiatives.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view communication activities for their initiatives"
  ON public.communication_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = communication_activities.initiative_id
      AND (
        initiatives.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_team_members.initiative_id = initiatives.id
          AND initiative_team_members.user_id = auth.uid()
        )
      )
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_communication_activities_updated_at
  BEFORE UPDATE ON public.communication_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();