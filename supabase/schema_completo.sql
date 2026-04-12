-- ============================================================
-- SCHEMA COMPLETO - Va Va Voom Vault
-- Execute este arquivo no SQL Editor do seu novo projeto Supabase
-- ============================================================


-- ── 1. TABELA PROFILES ──────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  tagline TEXT,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  cover_image TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  price_duration TEXT DEFAULT '1 hora',
  verified BOOLEAN DEFAULT false,
  verified_date TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  phone TEXT,
  height TEXT,
  weight TEXT,
  gender TEXT,
  gender_description TEXT,
  genitalia TEXT,
  sexual_preference TEXT,
  sexual_preference_description TEXT,
  ethnicity TEXT,
  eye_color TEXT,
  hair_color TEXT,
  hair_length TEXT,
  shoe_size TEXT,
  silicone BOOLEAN DEFAULT false,
  tattoos BOOLEAN DEFAULT false,
  piercings BOOLEAN DEFAULT false,
  smoker BOOLEAN DEFAULT false,
  languages TEXT[] DEFAULT '{}',
  location TEXT,
  location_zone TEXT,
  location_distance TEXT,
  places_served TEXT,
  amenities TEXT,
  neighborhoods TEXT[] DEFAULT '{}',
  nearby_cities TEXT,
  has_own_place BOOLEAN DEFAULT false,
  attends_to TEXT,
  max_clients TEXT,
  pricing JSONB DEFAULT '[]',
  payment_methods TEXT[] DEFAULT '{}',
  schedule JSONB DEFAULT '[]',
  profile_created_at TEXT,
  detailed_services JSONB DEFAULT '[]',
  services TEXT[] DEFAULT '{}',
  reviews JSONB DEFAULT '[]',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_types TEXT[] DEFAULT ARRAY['acompanhante']::TEXT[],
  plan TEXT DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can create their own model profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own model profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own model profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Grants para as colunas (evita problema de schema cache)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;


-- ── 2. TABELA USER_PROFILES ─────────────────────────────────
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;


-- ── 3. TABELA FAVORITES ─────────────────────────────────────
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;


-- ── 4. TRIGGERS ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 5. FUNÇÃO RPC PARA ADMIN ─────────────────────────────────
CREATE OR REPLACE FUNCTION set_profile_plan(
  profile_id UUID,
  new_plan TEXT,
  new_expires_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET plan = new_plan,
      plan_expires_at = new_expires_at
  WHERE id = profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_profile_plan(UUID, TEXT, TIMESTAMPTZ) TO authenticated;


-- ── 6. STORAGE BUCKET ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-photos', 'model-photos', true);

CREATE POLICY "Anyone can view model photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'model-photos');

CREATE POLICY "Authenticated users can upload their own photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'model-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'model-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'model-photos' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── 7. RELOAD SCHEMA CACHE ───────────────────────────────────
NOTIFY pgrst, 'reload schema';
