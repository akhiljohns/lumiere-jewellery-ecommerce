-- ================================================
-- Migration: Create carts and cart_items tables
-- One server-side cart per authenticated customer.
-- Guest carts live in localStorage only.
-- ================================================

-- ── CARTS ────────────────────────────────────────
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid unique not null references public.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index idx_carts_customer_id on public.carts(customer_id);

create trigger set_carts_updated_at
  before update on public.carts
  for each row execute function public.handle_updated_at();

-- ── CART ITEMS ───────────────────────────────────
create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  quantity    int not null default 1 check (quantity > 0),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  unique(cart_id, product_id)
);

create index idx_cart_items_cart_id on public.cart_items(cart_id);
create index idx_cart_items_product_id on public.cart_items(product_id);

create trigger set_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.handle_updated_at();

-- ── RLS (enabled; service-role client bypasses) ──
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
