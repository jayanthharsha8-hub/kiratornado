
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  rank_label TEXT NOT NULL DEFAULT 'E',
  rank_position INTEGER NOT NULL DEFAULT 10,
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can view leaderboard"
ON public.leaderboard_entries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage leaderboard"
ON public.leaderboard_entries FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
