CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE UNIQUE INDEX IF NOT EXISTS registrations_tournament_user_unique
ON public.registrations (tournament_id, user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;