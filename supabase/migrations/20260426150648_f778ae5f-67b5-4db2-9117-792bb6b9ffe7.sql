CREATE OR REPLACE FUNCTION public.ensure_player_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_is_new boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user) THEN
    INSERT INTO public.profiles (id, username, player_name, ff_uid, player_level, referral_code)
    VALUES (
      v_user,
      COALESCE(split_part(v_email, '@', 1), 'player_' || substr(v_user::text, 1, 8)),
      'New Hunter',
      '',
      1,
      NULL
    );
    v_is_new := true;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF v_email = 'jayanthharsha8@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('new_user', v_is_new);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_player_account() TO authenticated;