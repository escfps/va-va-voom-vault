-- =============================================
-- TABELA: profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  age integer NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  price_duration text,
  is_active boolean NOT NULL DEFAULT true,
  verified boolean DEFAULT false,
  verified_date text,
  plan text,
  plan_expires_at text,
  profile_types text[],
  tagline text,
  description text,
  phone text,
  image text,
  images text[],
  cover_image text,
  services text[],
  detailed_services jsonb,
  pricing jsonb,
  payment_methods text[],
  schedule jsonb,
  reviews jsonb,
  rating numeric,
  review_count integer,
  location text,
  location_zone text,
  location_distance text,
  nearby_cities text,
  neighborhoods text[],
  places_served text,
  attends_to text,
  has_own_place boolean,
  max_clients text,
  languages text[],
  ethnicity text,
  height text,
  weight text,
  hair_color text,
  hair_length text,
  eye_color text,
  shoe_size text,
  gender text,
  gender_description text,
  sexual_preference text,
  sexual_preference_description text,
  genitalia text,
  silicone boolean,
  tattoos boolean,
  piercings boolean,
  smoker boolean,
  amenities text,
  tags text[],
  profile_created_at text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: favorites
-- =============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

-- =============================================
-- TABELA: user_profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- FUNÇÃO: set_profile_plan
-- =============================================
CREATE OR REPLACE FUNCTION public.set_profile_plan(
  profile_id uuid,
  new_plan text,
  new_expires_at text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET plan = new_plan, plan_expires_at = new_expires_at, updated_at = now()
  WHERE id = profile_id;
END;
$$;

-- =============================================
-- TRIGGER: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TRIGGER: criar user_profile ao criar usuário
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS: habilitar
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: profiles
-- =============================================
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: favorites
-- =============================================
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: user_profiles
-- =============================================
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-images', 'profile-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('cover-images', 'cover-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_profile_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "storage_profile_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "storage_profile_images_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_cover_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cover-images');

CREATE POLICY "storage_cover_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cover-images' AND auth.role() = 'authenticated');
