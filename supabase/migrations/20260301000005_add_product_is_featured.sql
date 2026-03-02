-- Add is_featured column to products table
-- Used by storefront to highlight featured/trending products on homepage

alter table public.products
  add column if not exists is_featured boolean not null default false;

create index if not exists idx_products_is_featured on public.products(is_featured)
  where is_featured = true;
