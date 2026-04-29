-- Create a dedicated public bucket for all admin-managed banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-banners', 'app-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view banner images
CREATE POLICY "Authenticated users can view app banner images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'app-banners');

-- Allow admins to upload banner images
CREATE POLICY "Admins can upload app banner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-banners' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update banner images
CREATE POLICY "Admins can update app banner images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'app-banners' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'app-banners' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete banner images
CREATE POLICY "Admins can delete app banner images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'app-banners' AND public.has_role(auth.uid(), 'admin'));

-- Shared timestamp helper for banner tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Home top slider banners: independent from categories and tournaments
CREATE TABLE public.home_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  button_text text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active home banners"
ON public.home_banners
FOR SELECT
TO authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage home banners"
ON public.home_banners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_home_banners_updated_at
BEFORE UPDATE ON public.home_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Home category grid images: one independent square image per category
CREATE TABLE public.category_card_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.tournament_category NOT NULL UNIQUE,
  card_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.category_card_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view category card images"
ON public.category_card_images
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage category card images"
ON public.category_card_images
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_category_card_images_updated_at
BEFORE UPDATE ON public.category_card_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tournament detail page banners: independent unique banner per tournament
CREATE TABLE public.tournament_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL UNIQUE,
  banner_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tournament banners"
ON public.tournament_banners
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tournament banners"
ON public.tournament_banners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tournament_banners_updated_at
BEFORE UPDATE ON public.tournament_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_home_banners_active_sort ON public.home_banners (active, sort_order);
CREATE INDEX idx_tournament_banners_tournament_id ON public.tournament_banners (tournament_id);