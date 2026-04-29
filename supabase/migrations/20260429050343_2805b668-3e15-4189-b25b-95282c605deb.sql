DROP POLICY IF EXISTS "Authenticated users can view app banner images" ON storage.objects;

CREATE POLICY "Admins can view app banner image records"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'app-banners' AND public.has_role(auth.uid(), 'admin'));