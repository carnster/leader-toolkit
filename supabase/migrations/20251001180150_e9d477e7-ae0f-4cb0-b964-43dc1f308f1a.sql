-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE app_role AS ENUM ('district_leader', 'principal', 'implementation_lead', 'teacher', 'data_manager', 'governor');
CREATE TYPE initiative_stage AS ENUM ('decide', 'plan', 'implement', 'monitor', 'sustain');
CREATE TYPE initiative_status AS ENUM ('active', 'on_hold', 'completed', 'archived');
CREATE TYPE pdsa_status AS ENUM ('planning', 'testing', 'complete');
CREATE TYPE indicator_type AS ENUM ('leading', 'lagging');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'teacher',
  organization TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Initiatives table (main entity) - create without RLS policies first
CREATE TABLE public.initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  stage initiative_stage NOT NULL DEFAULT 'decide',
  status initiative_status NOT NULL DEFAULT 'active',
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  start_date DATE,
  target_end_date DATE,
  context_tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

-- Initiative Team Members table - create this before initiatives RLS policies
CREATE TABLE public.initiative_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_initiative TEXT NOT NULL,
  responsibilities TEXT[],
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(initiative_id, user_id)
);

ALTER TABLE public.initiative_team_members ENABLE ROW LEVEL SECURITY;

-- Now create RLS policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Now create RLS policies for initiatives (can reference initiative_team_members)
CREATE POLICY "Users can view initiatives they're involved in"
  ON public.initiatives FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.initiative_team_members
      WHERE initiative_id = initiatives.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Initiative owners can update their initiatives"
  ON public.initiatives FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create initiatives"
  ON public.initiatives FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS policies for team members
CREATE POLICY "Users can view team members for their initiatives"
  ON public.initiative_team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = initiative_team_members.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        auth.uid() = initiative_team_members.user_id
      )
    )
  );

CREATE POLICY "Initiative owners can manage team members"
  ON public.initiative_team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = initiative_team_members.initiative_id
      AND auth.uid() = initiatives.owner_id
    )
  );

-- Decision Briefs table (Decide stage)
CREATE TABLE public.decision_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL,
  target_group TEXT NOT NULL,
  baseline_data TEXT,
  root_causes TEXT[],
  equity_notes TEXT,
  stakeholder_input TEXT,
  chosen_approach TEXT,
  evidence_base TEXT,
  feasibility_score INTEGER CHECK (feasibility_score BETWEEN 1 AND 5),
  leading_indicators TEXT[],
  lagging_indicators TEXT[],
  measurement_timeline TEXT,
  checklist_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(initiative_id)
);

ALTER TABLE public.decision_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view decision briefs for their initiatives"
  ON public.decision_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = decision_briefs.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage decision briefs for their initiatives"
  ON public.decision_briefs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = decision_briefs.initiative_id
      AND auth.uid() = initiatives.owner_id
    )
  );

-- Active Ingredients table (Plan stage)
CREATE TABLE public.active_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_core BOOLEAN NOT NULL DEFAULT true,
  look_fors TEXT[],
  adaptable_boundaries TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.active_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active ingredients for their initiatives"
  ON public.active_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = active_ingredients.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage active ingredients for their initiatives"
  ON public.active_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = active_ingredients.initiative_id
      AND auth.uid() = initiatives.owner_id
    )
  );

-- Fidelity Logs table (Implement stage)
CREATE TABLE public.fidelity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  component_id UUID REFERENCES public.active_ingredients(id) ON DELETE SET NULL,
  observer_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fidelity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fidelity logs for their initiatives"
  ON public.fidelity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = fidelity_logs.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Team members can create fidelity logs"
  ON public.fidelity_logs FOR INSERT
  WITH CHECK (
    auth.uid() = observer_id AND
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = fidelity_logs.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

-- Indicators table (Monitor stage)
CREATE TABLE public.indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type indicator_type NOT NULL,
  source TEXT,
  schedule TEXT,
  target_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indicators for their initiatives"
  ON public.indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = indicators.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage indicators for their initiatives"
  ON public.indicators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = indicators.initiative_id
      AND auth.uid() = initiatives.owner_id
    )
  );

-- Indicator Values table (time-series data)
CREATE TABLE public.indicator_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE public.indicator_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indicator values"
  ON public.indicator_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.indicators
      JOIN public.initiatives ON initiatives.id = indicators.initiative_id
      WHERE indicators.id = indicator_values.indicator_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add indicator values"
  ON public.indicator_values FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.indicators
      JOIN public.initiatives ON initiatives.id = indicators.initiative_id
      WHERE indicators.id = indicator_values.indicator_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

-- PDSA Cycles table (Monitor stage)
CREATE TABLE public.pdsa_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  aim TEXT NOT NULL,
  change_idea TEXT NOT NULL,
  test_window_start DATE,
  test_window_end DATE,
  results TEXT,
  decision TEXT,
  status pdsa_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pdsa_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view PDSA cycles for their initiatives"
  ON public.pdsa_cycles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = pdsa_cycles.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage PDSA cycles for their initiatives"
  ON public.pdsa_cycles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = pdsa_cycles.initiative_id
      AND auth.uid() = initiatives.owner_id
    )
  );

-- Sustainability Plans table (Sustain stage)
CREATE TABLE public.sustainability_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  embedding_routines JSONB,
  onboarding_resources JSONB,
  resource_protections JSONB,
  scale_readiness_score INTEGER CHECK (scale_readiness_score BETWEEN 1 AND 5),
  next_steps TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(initiative_id)
);

ALTER TABLE public.sustainability_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sustainability plans for their initiatives"
  ON public.sustainability_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = sustainability_plans.initiative_id
      AND (
        auth.uid() = initiatives.owner_id OR
        EXISTS (
          SELECT 1 FROM public.initiative_team_members
          WHERE initiative_id = initiatives.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage sustainability plans for their initiatives"
  ON public.sustainability_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.initiatives
      WHERE initiatives.id = sustainability_plans.initiative_id
      AND auth.uid() = initiatives.owner_id
    )
  );

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.initiatives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.decision_briefs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.pdsa_cycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sustainability_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_initiatives_owner ON public.initiatives(owner_id);
CREATE INDEX idx_initiatives_stage ON public.initiatives(stage);
CREATE INDEX idx_initiatives_status ON public.initiatives(status);
CREATE INDEX idx_decision_briefs_initiative ON public.decision_briefs(initiative_id);
CREATE INDEX idx_active_ingredients_initiative ON public.active_ingredients(initiative_id);
CREATE INDEX idx_team_members_initiative ON public.initiative_team_members(initiative_id);
CREATE INDEX idx_team_members_user ON public.initiative_team_members(user_id);
CREATE INDEX idx_fidelity_logs_initiative ON public.fidelity_logs(initiative_id);
CREATE INDEX idx_fidelity_logs_observer ON public.fidelity_logs(observer_id);
CREATE INDEX idx_indicators_initiative ON public.indicators(initiative_id);
CREATE INDEX idx_indicator_values_indicator ON public.indicator_values(indicator_id);
CREATE INDEX idx_pdsa_cycles_initiative ON public.pdsa_cycles(initiative_id);
CREATE INDEX idx_sustainability_plans_initiative ON public.sustainability_plans(initiative_id);