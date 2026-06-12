-- Share links expire after 30 days; get-shared-brief enforces this server-side.
ALTER TABLE public.share_links
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

-- Notifications could be forged: INSERT WITH CHECK (true) let any signed-in
-- user write a notification addressed to any other user (in-product phishing).
-- The system notification creators are SECURITY DEFINER functions that bypass
-- RLS, so clients only ever need to insert rows addressed to themselves.
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can create their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
