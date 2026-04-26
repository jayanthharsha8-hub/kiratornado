-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  player_name TEXT NOT NULL,
  ff_uid TEXT NOT NULL,
  player_level INTEGER NOT NULL DEFAULT 1,
  referral_code TEXT,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Tournaments
CREATE TYPE public.tournament_category AS ENUM ('free_match','battle_royale','classic_squad','lone_wolf');
CREATE TYPE public.tournament_status AS ENUM ('upcoming','live','completed','cancelled');

CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category tournament_category NOT NULL,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  total_slots INTEGER NOT NULL,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ NOT NULL,
  room_id TEXT,
  room_password TEXT,
  status tournament_status NOT NULL DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone authed can view tournaments" ON public.tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage tournaments" ON public.tournaments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Registrations
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own regs" ON public.registrations FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create own regs" ON public.registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Wallet requests
CREATE TYPE public.wallet_request_type AS ENUM ('add','withdraw');
CREATE TYPE public.wallet_request_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.wallet_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type wallet_request_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  upi_ref TEXT,
  upi_id TEXT,
  status wallet_request_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own wallet" ON public.wallet_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create own wallet" ON public.wallet_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update wallet" ON public.wallet_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Feedback
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "create own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins view feedback" ON public.feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Trigger: auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, player_name, ff_uid, player_level, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substr(NEW.id::text,1,8)),
    COALESCE(NEW.raw_user_meta_data->>'player_name', 'Player'),
    COALESCE(NEW.raw_user_meta_data->>'ff_uid', ''),
    COALESCE((NEW.raw_user_meta_data->>'player_level')::int, 1),
    NEW.raw_user_meta_data->>'referral_code'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed tournaments
INSERT INTO public.tournaments (title, category, entry_fee, total_slots, prize_pool, scheduled_at, notes) VALUES
('Free Match #1', 'free_match', 0, 50, 0, now() + interval '2 hours', 'Daily free match'),
('Free Match #2', 'free_match', 0, 50, 0, now() + interval '6 hours', 'Daily free match'),
('Battle Royale Solo', 'battle_royale', 5, 50, 200, now() + interval '4 hours', 'Solo BR tournament'),
('Battle Royale Pro', 'battle_royale', 5, 50, 250, now() + interval '1 day', 'Pro BR tournament'),
('Classic Squad 4v4', 'classic_squad', 10, 32, 300, now() + interval '5 hours', '8 squads of 4'),
('Lone Wolf 2v2', 'lone_wolf', 10, 4, 80, now() + interval '3 hours', '2v2 deathmatch');