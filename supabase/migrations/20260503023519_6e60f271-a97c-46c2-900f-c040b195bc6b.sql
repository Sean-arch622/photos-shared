CREATE POLICY "anyone delete photos" ON public.photos FOR DELETE USING (true);
CREATE POLICY "public delete family photos" ON storage.objects FOR DELETE USING (bucket_id = 'family-photos');