-- Add profile_types array column to support multiple roles per profile
-- (e.g. someone can be both 'acompanhante' and 'conteudo')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_types TEXT[] DEFAULT ARRAY['acompanhante']::TEXT[];
