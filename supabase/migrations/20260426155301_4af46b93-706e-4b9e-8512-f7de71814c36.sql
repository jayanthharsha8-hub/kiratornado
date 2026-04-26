CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('debit', 'credit', 'withdraw')),
  amount integer NOT NULL CHECK (amount > 0),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'rejected')),
  reference_type text,
  reference_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
CREATE POLICY "Users view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage transactions" ON public.transactions;
CREATE POLICY "Admins manage transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference_type, reference_id);

CREATE OR REPLACE FUNCTION public.join_tournament(_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_tournament public.tournaments%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_count integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;

  SELECT * INTO v_tournament FROM public.tournaments WHERE id = _tournament_id AND published = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_tournament.status <> 'upcoming' THEN RAISE EXCEPTION 'Tournament is not open for joining'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player profile not found'; END IF;
  IF v_profile.player_level < v_tournament.level_requirement THEN RAISE EXCEPTION 'Level % required', v_tournament.level_requirement; END IF;
  IF EXISTS (SELECT 1 FROM public.registrations WHERE tournament_id = _tournament_id AND user_id = v_user) THEN RAISE EXCEPTION 'Already joined'; END IF;

  SELECT count(*) INTO v_count FROM public.registrations WHERE tournament_id = _tournament_id;
  IF v_count >= v_tournament.total_slots THEN RAISE EXCEPTION 'Match full'; END IF;

  IF v_tournament.entry_fee > 0 THEN
    IF v_profile.coins < v_tournament.entry_fee THEN RAISE EXCEPTION 'Not enough coins'; END IF;
    PERFORM set_config('app.system_coin_update', 'on', true);
    UPDATE public.profiles SET coins = coins - v_tournament.entry_fee, updated_at = now() WHERE id = v_user;
    INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id)
    VALUES (v_user, 'debit', v_tournament.entry_fee, 'Joined Match', 'success', 'tournament', _tournament_id);
  END IF;

  INSERT INTO public.registrations (tournament_id, user_id) VALUES (_tournament_id, v_user);
  RETURN jsonb_build_object('joined', true, 'coins', greatest(v_profile.coins - v_tournament.entry_fee, 0));
END;
$$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount integer, _withdraw_type withdraw_type, _upi_id text DEFAULT NULL::text, _upi_ref text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_request_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF _amount NOT IN (30, 50, 100) THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF _withdraw_type = 'upi' AND (coalesce(trim(_upi_id), '') = '' OR length(trim(_upi_id)) > 80) THEN RAISE EXCEPTION 'Valid UPI ID required'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player profile not found'; END IF;
  IF v_profile.coins < _amount THEN RAISE EXCEPTION 'Not enough coins'; END IF;

  PERFORM set_config('app.system_coin_update', 'on', true);
  UPDATE public.profiles SET coins = coins - _amount, updated_at = now() WHERE id = v_user;

  INSERT INTO public.wallet_requests (user_id, type, amount, withdraw_type, upi_id, upi_ref)
  VALUES (v_user, 'withdraw', _amount, _withdraw_type, nullif(trim(_upi_id), ''), nullif(trim(_upi_ref), ''))
  RETURNING id INTO v_request_id;

  INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id)
  VALUES (v_user, 'withdraw', _amount, 'Withdraw', 'pending', 'wallet_request', v_request_id);

  RETURN jsonb_build_object('request_id', v_request_id, 'coins', v_profile.coins - _amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_handle_wallet_request(_request_id uuid, _status wallet_request_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_req public.wallet_requests%ROWTYPE;
  v_coins integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF _status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO v_req FROM public.wallet_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already handled'; END IF;

  UPDATE public.wallet_requests SET status = _status WHERE id = _request_id;

  IF _status = 'approved' AND v_req.type = 'add' THEN
    PERFORM set_config('app.system_coin_update', 'on', true);
    UPDATE public.profiles SET coins = coins + v_req.amount, updated_at = now() WHERE id = v_req.user_id RETURNING coins INTO v_coins;
    INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id)
    VALUES (v_req.user_id, 'credit', v_req.amount, 'Winnings', 'success', 'wallet_request', v_req.id);
  ELSIF _status = 'rejected' AND v_req.type = 'withdraw' THEN
    PERFORM set_config('app.system_coin_update', 'on', true);
    UPDATE public.profiles SET coins = coins + v_req.amount, updated_at = now() WHERE id = v_req.user_id RETURNING coins INTO v_coins;
    UPDATE public.transactions SET status = 'rejected' WHERE reference_type = 'wallet_request' AND reference_id = v_req.id;
  ELSE
    SELECT coins INTO v_coins FROM public.profiles WHERE id = v_req.user_id;
    UPDATE public.transactions SET status = CASE WHEN _status = 'approved' THEN 'success' ELSE 'rejected' END WHERE reference_type = 'wallet_request' AND reference_id = v_req.id;
  END IF;

  RETURN jsonb_build_object('status', _status, 'coins', v_coins);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_coins(_user_id uuid, _amount integer, _direction integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current integer;
  v_next integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF _amount <= 0 OR _direction NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Invalid coin adjustment';
  END IF;

  SELECT coins INTO v_current FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player not found'; END IF;
  v_next := greatest(0, v_current + (_direction * _amount));

  PERFORM set_config('app.system_coin_update', 'on', true);
  UPDATE public.profiles SET coins = v_next, updated_at = now() WHERE id = _user_id;

  INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type)
  VALUES (_user_id, CASE WHEN _direction = 1 THEN 'credit' ELSE 'debit' END, _amount, CASE WHEN _direction = 1 THEN 'Winnings' ELSE 'Joined Match' END, 'success', 'admin_adjustment');

  RETURN jsonb_build_object('coins', v_next);
END;
$$;