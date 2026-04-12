-- Adiciona campo de status para aprovação manual de perfis
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Perfis já existentes ficam aprovados automaticamente
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

GRANT SELECT, UPDATE (status) ON public.profiles TO authenticated;
GRANT SELECT, UPDATE (status) ON public.profiles TO service_role;

NOTIFY pgrst, 'reload schema';
