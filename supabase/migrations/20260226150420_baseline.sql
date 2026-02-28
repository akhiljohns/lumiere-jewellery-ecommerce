-- ================================================
-- Baseline migration: Full database schema
-- Drops existing tables for a clean slate, then recreates everything.
-- ================================================

-- ── DROP EXISTING OBJECTS (reverse dependency order) ──
drop table if exists public.product_images cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.users cascade;
drop function if exists public.handle_updated_at() cascade;

-- ── RESTORE SUPABASE ROLE GRANTS ─────────────────
-- Required after DROP SCHEMA public CASCADE / CREATE SCHEMA public
-- Without these, PostgREST (Supabase REST API) cannot access the tables.
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on routines to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

-- ── UPDATED_AT TRIGGER FUNCTION ────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── USERS ──────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  full_name     text,
  phone         text,
  avatar_url    text,
  role          text not null default 'customer',
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);

create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

alter table public.users enable row level security;

-- ── ROLES & PERMISSIONS (RBAC) ─────────────────
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  description text,
  is_system   boolean default false,
  created_at  timestamptz default now()
);

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  resource    text not null,
  action      text not null,
  description text
);

create table if not exists public.role_permissions (
  role_id       uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- ── CATEGORIES ─────────────────────────────────
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  parent_id     uuid references public.categories(id) on delete set null,
  image_url     text,
  sort_order    integer not null default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_sort_order on public.categories(sort_order);

create trigger on_categories_updated
  before update on public.categories
  for each row execute function public.handle_updated_at();

alter table public.categories enable row level security;

create policy "Active categories are viewable by everyone"
  on public.categories for select
  using (is_active = true);

-- ── PRODUCTS ───────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  description   text,
  price         numeric(10,2) not null,
  compare_price numeric(10,2),
  category_id   uuid references public.categories(id) on delete set null,
  material      text,
  weight        text,
  stock         integer not null default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_is_active on public.products(is_active);

create trigger on_products_updated
  before update on public.products
  for each row execute function public.handle_updated_at();

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select
  using (is_active = true);

-- ── PRODUCT IMAGES ─────────────────────────────
create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  url           text not null,
  public_id     text not null,
  is_primary    boolean default false,
  sort_order    integer default 0,
  created_at    timestamptz default now()
);

create index if not exists idx_product_images_product_id on public.product_images(product_id);

alter table public.product_images enable row level security;

create policy "Product images are viewable by everyone"
  on public.product_images for select
  using (true);

-- ================================================
-- SEED DATA: Permissions, Roles, Role-Permissions, Admin User
-- ================================================

-- ── Permissions ─────────────────────────────────
insert into public.permissions (name, resource, action) values
  ('product.view',    'product',    'view'),
  ('product.create',  'product',    'create'),
  ('product.edit',    'product',    'edit'),
  ('product.delete',  'product',    'delete'),
  ('category.view',   'category',   'view'),
  ('category.create', 'category',   'create'),
  ('category.edit',   'category',   'edit'),
  ('category.delete', 'category',   'delete'),
  ('user.view',       'user',       'view'),
  ('user.create',     'user',       'create'),
  ('user.edit',       'user',       'edit'),
  ('user.delete',     'user',       'delete'),
  ('dashboard.view',  'dashboard',  'view')
on conflict (name) do nothing;

-- ── Roles ───────────────────────────────────────
insert into public.roles (name, description, is_system) values
  ('super_admin',      'Full access, bypasses all permission checks', true),
  ('admin',            'Full admin access via permissions',           true),
  ('product_manager',  'Manage products and view dashboard',         false),
  ('viewer',           'Read-only access',                           false)
on conflict (name) do nothing;

-- ── Role ↔ Permission mappings ──────────────────
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'product_manager'
  and p.name in (
    'product.view', 'product.create', 'product.edit', 'product.delete',
    'category.view', 'category.create', 'category.edit', 'category.delete',
    'dashboard.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'viewer'
  and p.name in ('product.view', 'category.view', 'user.view', 'dashboard.view')
on conflict do nothing;

-- ── Master admin user ───────────────────────────
-- Email: admin@jewellery.com | Password: admin123
-- Change the password after first login!
insert into public.users (email, password_hash, full_name, role, is_active) values
  ('admin@jewellery.com',
   '$2b$12$BSgKq3re7WRKqgFDpPXPcu9xm9odGcEPBT6ZhO5TWszgDBHB8e7Mu',
   'Master Admin',
   'super_admin',
   true)
on conflict (email) do nothing;
