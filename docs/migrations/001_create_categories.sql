-- ================================================
-- Migration 001: Create categories table & migrate products.category → category_id
-- Run this in the Supabase SQL Editor on existing databases
-- ================================================

-- ── 1. Create categories table ──────────────────
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

-- ── 2. Indexes ──────────────────────────────────
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_sort_order on public.categories(sort_order);

-- ── 3. Updated_at trigger ───────────────────────
create trigger on_categories_updated
  before update on public.categories
  for each row execute function public.handle_updated_at();

-- ── 4. RLS ──────────────────────────────────────
alter table public.categories enable row level security;

create policy "Active categories are viewable by everyone"
  on public.categories for select
  using (is_active = true);

-- ── 5. Migrate products: category (text) → category_id (uuid FK) ──
-- 5a. Add the new column
alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;

-- 5b. Insert distinct categories from existing products
insert into public.categories (name, slug)
select distinct
  category,
  lower(trim(regexp_replace(regexp_replace(category, '[^\w\s-]', '', 'g'), '[\s_]+', '-', 'g')))
from public.products
where category is not null and category <> ''
on conflict (slug) do nothing;

-- 5c. Backfill category_id on existing products
update public.products p
set category_id = c.id
from public.categories c
where p.category = c.name
  and p.category_id is null;

-- 5d. Drop old column and index
drop index if exists idx_products_category;
alter table public.products drop column if exists category;

-- 5e. Create new index on category_id
create index if not exists idx_products_category_id on public.products(category_id);
