-- 1. DROP old policies (to avoid conflicts or cleanup old bad policies)
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload User" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update User" ON storage.objects;

-- 2. Allow public access to 'avatars' bucket (SELECT)
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to upload/update ONLY in their own folder
-- Path convention: avatars/{userId}/{filename}
-- (storage.foldername(name))[1] gets the first part of the path (the folder)

CREATE POLICY "Avatar Upload User"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatar Update User"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatar Delete User"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
