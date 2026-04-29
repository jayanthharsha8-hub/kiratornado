CREATE TABLE IF NOT EXISTS public.tournament_page_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category tournament_category NOT NULL UNIQUE,
  banner_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_page_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tournament page banners"
ON public.tournament_page_banners
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tournament page banners"
ON public.tournament_page_banners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tournament_page_banners_updated_at
BEFORE UPDATE ON public.tournament_page_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();