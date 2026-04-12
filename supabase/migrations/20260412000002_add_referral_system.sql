-- ============================================================
-- SISTEMA DE INDICAÇÃO - Colunas e tabela
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Adiciona colunas de indicação na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS referral_balance NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Índice para busca rápida por código de indicação
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code);

-- Tabela de transações de indicação
CREATE TABLE IF NOT EXISTS public.referral_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_id)
);

-- Permissões
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referral_transactions"
  ON public.referral_transactions FOR ALL
  USING (true);

NOTIFY pgrst, 'reload schema';
