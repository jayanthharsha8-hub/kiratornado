
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF NEW.email = 'jayanthharsha8@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;
