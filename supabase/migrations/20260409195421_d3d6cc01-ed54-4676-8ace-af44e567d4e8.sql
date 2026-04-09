
-- Create profiles table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
