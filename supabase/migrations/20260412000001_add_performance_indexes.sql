-- Índices para acelerar as queries mais comuns
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_status_active ON public.profiles (status, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles (plan);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles (city);

NOTIFY pgrst, 'reload schema';
