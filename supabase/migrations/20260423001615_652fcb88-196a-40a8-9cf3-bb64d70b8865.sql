
-- Report reason enum
CREATE TYPE public.report_reason AS ENUM ('hacker', 'fake', 'wrong_uid', 'misconduct');
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'actioned', 'ignored');
CREATE TYPE public.withdraw_type AS ENUM ('redeem', 'upi');

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason public.report_reason NOT NULL,
  description TEXT,
  status public.report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage reports" ON public.reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Bans table
CREATE TABLE public.bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bans" ON public.bans
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users check own ban" ON public.bans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS matches_played INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_kills INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add withdraw_type to wallet_requests
ALTER TABLE public.wallet_requests
  ADD COLUMN IF NOT EXISTS withdraw_type public.withdraw_type;
