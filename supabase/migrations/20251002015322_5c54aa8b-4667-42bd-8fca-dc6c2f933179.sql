-- Create budget_items table for tracking budget allocations
CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text,
  estimated_cost numeric(10,2) NOT NULL DEFAULT 0,
  actual_cost numeric(10,2),
  funding_source text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create time_commitments table for role-based time allocations
CREATE TABLE public.time_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  hours_per_week numeric(5,2),
  hours_per_month numeric(5,2),
  description text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_commitments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_items
CREATE POLICY "Users can view budget items for their initiatives"
ON public.budget_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = budget_items.initiative_id
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

CREATE POLICY "Users can manage budget items for their initiatives"
ON public.budget_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = budget_items.initiative_id
    AND auth.uid() = initiatives.owner_id
  )
);

-- RLS Policies for time_commitments
CREATE POLICY "Users can view time commitments for their initiatives"
ON public.time_commitments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = time_commitments.initiative_id
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

CREATE POLICY "Users can manage time commitments for their initiatives"
ON public.time_commitments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    WHERE initiatives.id = time_commitments.initiative_id
    AND auth.uid() = initiatives.owner_id
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_time_commitments_updated_at
BEFORE UPDATE ON public.time_commitments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.budget_items IS 'Budget breakdown and resource costs for initiatives';
COMMENT ON TABLE public.time_commitments IS 'Time allocation estimates by role for initiatives';