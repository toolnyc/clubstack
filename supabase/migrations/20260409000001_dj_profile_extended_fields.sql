-- Add extended profile fields to dj_profiles
-- Epic: dj-profile-mobile

ALTER TABLE dj_profiles
  ADD COLUMN avatar_url text,
  ADD COLUMN genres text[],
  ADD COLUMN field_visibility jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN press_kit jsonb NOT NULL DEFAULT '{}';

-- Storage buckets for avatars and press kit files
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('press-kits', 'press-kits', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: anyone can read, authenticated owner can write
CREATE POLICY "Public avatar read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Owner avatar upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner avatar update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner avatar delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Press kits: authenticated can read (visibility gated in app), owner can write
CREATE POLICY "Authenticated press-kit read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'press-kits'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Owner press-kit upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'press-kits'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner press-kit update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'press-kits'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner press-kit delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'press-kits'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
