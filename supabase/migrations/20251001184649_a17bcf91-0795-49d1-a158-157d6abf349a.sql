-- Allow initiative owners to delete their own initiatives
CREATE POLICY "Initiative owners can delete their initiatives"
ON public.initiatives
FOR DELETE
USING (auth.uid() = owner_id);