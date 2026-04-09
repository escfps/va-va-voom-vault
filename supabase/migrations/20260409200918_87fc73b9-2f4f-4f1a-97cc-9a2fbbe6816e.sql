
-- Create storage bucket for model photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-photos', 'model-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view model photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'model-photos');

CREATE POLICY "Authenticated users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'model-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'model-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'model-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add user_id to profiles table
ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Allow authenticated users to create their own profile
CREATE POLICY "Users can create their own model profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own model profile
CREATE POLICY "Users can update their own model profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own model profile
CREATE POLICY "Users can delete their own model profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
