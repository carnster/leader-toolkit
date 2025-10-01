-- Create implementation_strategies table
CREATE TABLE public.implementation_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id UUID NOT NULL,
  eric_category TEXT NOT NULL CHECK (eric_category IN ('enable', 'redesign', 'integrate', 'create')),
  strategy_name TEXT NOT NULL,
  description TEXT,
  target_barrier TEXT,
  responsible_party UUID,
  timeline TEXT,
  resources_needed TEXT,
  success_indicators TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.implementation_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage strategies for their initiatives"
ON public.implementation_strategies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = implementation_strategies.initiative_id
    AND initiatives.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view strategies for their initiatives"
ON public.implementation_strategies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = implementation_strategies.initiative_id
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

-- Add updated_at trigger
CREATE TRIGGER update_implementation_strategies_updated_at
BEFORE UPDATE ON public.implementation_strategies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();