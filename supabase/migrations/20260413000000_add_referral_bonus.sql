-- Bônus de indicação: perfil em destaque por 7 dias + 5 fotos no free
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_bonus_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_bonus ON public.profiles (referral_bonus_until);

NOTIFY pgrst, 'reload schema';
