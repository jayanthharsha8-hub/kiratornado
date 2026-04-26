
-- Add new columns to tournaments
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS level_requirement integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authed can view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admins manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete tournaments
CREATE POLICY "admins delete tournaments"
  ON public.tournaments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete registrations (remove player from slot)
CREATE POLICY "admins delete registrations"
  ON public.registrations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
