-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can create notifications for any user
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to create milestone deadline notifications
CREATE OR REPLACE FUNCTION public.create_milestone_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notifications for milestones due in 7 days
  INSERT INTO public.notifications (user_id, initiative_id, type, title, message, action_url)
  SELECT 
    i.owner_id,
    tm.initiative_id,
    'milestone_deadline',
    'Milestone Deadline Approaching',
    'Milestone "' || tm.milestone || '" is due in 7 days',
    '/plan?initiative=' || tm.initiative_id || '&section=execution'
  FROM public.timeline_milestones tm
  JOIN public.initiatives i ON i.id = tm.initiative_id
  WHERE tm.status != 'completed'
    AND tm.target_date = CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = i.owner_id
        AND n.type = 'milestone_deadline'
        AND n.created_at::date = CURRENT_DATE
        AND n.message LIKE '%' || tm.milestone || '%'
    );
END;
$$;

-- Function to create observation schedule notifications
CREATE OR REPLACE FUNCTION public.create_observation_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notifications for observations scheduled tomorrow
  INSERT INTO public.notifications (user_id, initiative_id, type, title, message, action_url)
  SELECT 
    COALESCE(os.observer_id, i.owner_id),
    os.initiative_id,
    'observation_scheduled',
    'Observation Scheduled Tomorrow',
    'Observation scheduled for ' || os.observation_type || ' at ' || COALESCE(os.location, 'TBD'),
    '/monitor?initiative=' || os.initiative_id
  FROM public.observation_schedules os
  JOIN public.initiatives i ON i.id = os.initiative_id
  WHERE os.status = 'scheduled'
    AND os.scheduled_date = CURRENT_DATE + INTERVAL '1 day'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = COALESCE(os.observer_id, i.owner_id)
        AND n.type = 'observation_scheduled'
        AND n.created_at::date = CURRENT_DATE
        AND n.initiative_id = os.initiative_id
    );
END;
$$;

-- Function to create PD activity notifications
CREATE OR REPLACE FUNCTION public.create_pd_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notifications for PD activities scheduled in 3 days
  INSERT INTO public.notifications (user_id, initiative_id, type, title, message, action_url)
  SELECT 
    i.owner_id,
    pd.initiative_id,
    'pd_activity_upcoming',
    'PD Activity Coming Up',
    'Professional development: "' || pd.title || '" scheduled in 3 days',
    '/implement?initiative=' || pd.initiative_id
  FROM public.pd_activities pd
  JOIN public.initiatives i ON i.id = pd.initiative_id
  WHERE pd.completion_status = 'planned'
    AND pd.scheduled_date = CURRENT_DATE + INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = i.owner_id
        AND n.type = 'pd_activity_upcoming'
        AND n.created_at::date = CURRENT_DATE
        AND n.message LIKE '%' || pd.title || '%'
    );
END;
$$;