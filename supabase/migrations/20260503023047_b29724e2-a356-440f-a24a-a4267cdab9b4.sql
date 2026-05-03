
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "anyone insert photos" ON public.photos FOR INSERT WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('family-photos', 'family-photos', true);

CREATE POLICY "public read family photos" ON storage.objects FOR SELECT USING (bucket_id = 'family-photos');
CREATE POLICY "public upload family photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'family-photos');
