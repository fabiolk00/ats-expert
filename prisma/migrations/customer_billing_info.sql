CREATE TABLE IF NOT EXISTS public.customer_billing_info (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  cpf_cnpj VARCHAR(20) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  address_number VARCHAR(10) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  province VARCHAR(2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_cpf_cnpj CHECK (char_length(trim(cpf_cnpj)) > 0),
  CONSTRAINT valid_phone CHECK (char_length(trim(phone_number)) > 0),
  CONSTRAINT valid_postal_code CHECK (char_length(trim(postal_code)) > 0),
  CONSTRAINT valid_province CHECK (char_length(trim(province)) = 2)
);

CREATE INDEX IF NOT EXISTS customer_billing_info_user_id_idx
  ON public.customer_billing_info(user_id);
