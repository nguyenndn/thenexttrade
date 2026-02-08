-- 1. Create 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to 'avatars' bucket (SELECT)
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to upload/update their own avatars
CREATE POLICY "Avatar Upload User"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] <> 'private' );

CREATE POLICY "Avatar Update User"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 4. Fix Tables Permissions (Grant usage to authenticated users)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 5. Enable RLS on Profile and User (Safety Check)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for User/Profile

-- User Table Policies
CREATE POLICY "Public Profiles" 
ON public."User" FOR SELECT 
USING (true);

CREATE POLICY "Users can update own record" 
ON public."User" FOR UPDATE 
USING (auth.uid() = id);

-- Profile Table Policies
CREATE POLICY "Public Profile View" 
ON public."Profile" FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own profile" 
ON public."Profile" FOR INSERT 
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own profile" 
ON public."Profile" FOR UPDATE 
USING (auth.uid() = "userId");

