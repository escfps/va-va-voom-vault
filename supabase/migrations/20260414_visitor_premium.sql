-- Adiciona colunas de plano premium para visitantes/clientes
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS visitor_plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS visitor_plan_expires_at timestamptz;

-- Adiciona flag para modelos bloquearem WhatsApp para não-premium
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_premium_only boolean DEFAULT false;
