-- Add customer authentication columns to users table

alter table public.users
  add column if not exists email_verified boolean not null default false,
  add column if not exists verification_token text,
  add column if not exists verification_token_expires timestamptz,
  add column if not exists reset_token text,
  add column if not exists reset_token_expires timestamptz;

-- Partial indexes for fast token lookups (only index non-null values)
create index if not exists idx_users_verification_token
  on public.users (verification_token)
  where verification_token is not null;

create index if not exists idx_users_reset_token
  on public.users (reset_token)
  where reset_token is not null;
