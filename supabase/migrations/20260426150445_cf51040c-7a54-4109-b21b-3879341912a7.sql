CREATE OR REPLACE FUNCTION public.prevent_player_coin_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NEW.coins IS DISTINCT FROM OLD.coins THEN
    RAISE EXCEPTION 'Coin balance can only be changed by system actions';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_player_coin_tampering_trigger ON public.profiles;
CREATE TRIGGER prevent_player_coin_tampering_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_player_coin_tampering();

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
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;

  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = _tournament_id AND published = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  IF v_tournament.status <> 'upcoming' THEN
    RAISE EXCEPTION 'Tournament is not open for joining';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player profile not found';
  END IF;

  IF v_profile.player_level < v_tournament.level_requirement THEN
    RAISE EXCEPTION 'Level % required', v_tournament.level_requirement;
  END IF;

  IF EXISTS (SELECT 1 FROM public.registrations WHERE tournament_id = _tournament_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Already joined';
  END IF;

  SELECT count(*) INTO v_count FROM public.registrations WHERE tournament_id = _tournament_id;
  IF v_count >= v_tournament.total_slots THEN
    RAISE EXCEPTION 'Slots full';
  END IF;

  IF v_tournament.entry_fee > 0 THEN
    IF v_profile.coins < v_tournament.entry_fee THEN
      RAISE EXCEPTION 'Insufficient coins';
    END IF;
    UPDATE public.profiles SET coins = coins - v_tournament.entry_fee, updated_at = now() WHERE id = v_user;
  END IF;

  INSERT INTO public.registrations (tournament_id, user_id)
  VALUES (_tournament_id, v_user);

  RETURN jsonb_build_object('joined', true, 'coins', greatest(v_profile.coins - v_tournament.entry_fee, 0));
END;
$$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount integer, _withdraw_type public.withdraw_type, _upi_id text DEFAULT NULL, _upi_ref text DEFAULT NULL)
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
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;
  IF _amount NOT IN (30, 50, 100) THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  IF _withdraw_type = 'upi' AND (coalesce(trim(_upi_id), '') = '' OR length(trim(_upi_id)) > 80) THEN
    RAISE EXCEPTION 'Valid UPI ID required';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player profile not found';
  END IF;
  IF v_profile.coins < _amount THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  UPDATE public.profiles SET coins = coins - _amount, updated_at = now() WHERE id = v_user;

  INSERT INTO public.wallet_requests (user_id, type, amount, withdraw_type, upi_id, upi_ref)
  VALUES (v_user, 'withdraw', _amount, _withdraw_type, nullif(trim(_upi_id), ''), nullif(trim(_upi_ref), ''))
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object('request_id', v_request_id, 'coins', v_profile.coins - _amount);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_tournament(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(integer, public.withdraw_type, text, text) TO authenticated;