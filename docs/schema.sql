-- ================================================
-- Jewellery E-Commerce — Database Schema
-- Run this in the Supabase SQL Editor to create tables
-- ================================================

-- ── USERS TABLE ──────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  full_name     text,
  phone         text,
  avatar_url    text,
  role          text not null default 'customer' check (role in ('admin', 'customer')),
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── PRODUCTS TABLE ───────────────────────────────
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  description   text,
  price         numeric(10,2) not null,
  compare_price numeric(10,2),
  category      text not null,
  material      text,
  weight        text,
  stock         integer not null default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── PRODUCT IMAGES TABLE ─────────────────────────
create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  url           text not null,
  public_id     text not null,
  is_primary    boolean default false,
  sort_order    integer default 0,
  created_at    timestamptz default now()
);

-- ── INDEXES ──────────────────────────────────────
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_is_active on public.products(is_active);
create index if not exists idx_product_images_product_id on public.product_images(product_id);

-- ── UPDATED_AT TRIGGER ───────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger on_products_updated
  before update on public.products
  for each row execute function public.handle_updated_at();

-- ── ROW LEVEL SECURITY ──────────────────────────
-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Public read access for products (storefront)
create policy "Products are viewable by everyone"
  on public.products for select
  using (is_active = true);

-- Public read access for product images
create policy "Product images are viewable by everyone"
  on public.product_images for select
  using (true);

-- NOTE: Admin operations bypass RLS via the service_role key.
-- No additional admin policies needed since we use createAdminClient().
