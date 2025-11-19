-- Fix 1: Create proper user_roles architecture
-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only admins or system can assign roles (for now, prevent all direct inserts)
CREATE POLICY "No direct role assignment"
ON public.user_roles FOR INSERT
WITH CHECK (false);

-- Create SECURITY DEFINER function for safe role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
WHERE role IS NOT NULL;

-- Fix 2: Restrict profile visibility to own profile and team members
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own and team profiles"
ON public.profiles FOR SELECT
USING (
  -- Users can see their own profile
  auth.uid() = id 
  OR
  -- Users can see profiles of people in their initiatives (as team members or owners)
  EXISTS (
    SELECT 1 
    FROM public.initiative_team_members itm1
    JOIN public.initiatives i ON i.id = itm1.initiative_id
    WHERE (itm1.user_id = profiles.id OR i.owner_id = profiles.id)
      AND (
        EXISTS (
          SELECT 1 FROM public.initiative_team_members itm2 
          WHERE itm2.initiative_id = i.id AND itm2.user_id = auth.uid()
        )
        OR i.owner_id = auth.uid()
      )
  )
);