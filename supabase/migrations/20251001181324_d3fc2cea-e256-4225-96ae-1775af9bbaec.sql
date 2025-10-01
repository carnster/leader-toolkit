-- Create security definer function to check team membership without recursion
CREATE OR REPLACE FUNCTION public.is_initiative_team_member(
  _initiative_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.initiative_team_members
    WHERE initiative_id = _initiative_id
      AND user_id = _user_id
  );
$$;

-- Drop and recreate the SELECT policy on initiatives using the function
DROP POLICY IF EXISTS "Users can view initiatives they're involved in" ON public.initiatives;

CREATE POLICY "Users can view initiatives they're involved in"
ON public.initiatives
FOR SELECT
USING (
  (auth.uid() = owner_id) 
  OR 
  public.is_initiative_team_member(id, auth.uid())
);