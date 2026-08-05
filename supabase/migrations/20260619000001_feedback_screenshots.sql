-- Screenshot support for pilot feedback: a private storage bucket plus a path
-- column on the feedback row.
ALTER TABLE public.pilot_feedback
  ADD COLUMN IF NOT EXISTS screenshot_path text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Users may upload to and read from their own folder (named by their uid).
-- Team review happens via the service role / dashboard, which bypasses RLS.
CREATE POLICY "authed upload own feedback screenshot"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "owner reads own feedback screenshot"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'feedback-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
