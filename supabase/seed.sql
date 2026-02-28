-- ================================================
-- Seed: Permissions, Roles, Role-Permissions, Admin User
-- Runs automatically after migrations on `supabase db reset`
-- ================================================

-- ── 1. Permissions ─────────────────────────────
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

-- ── 2. Roles ───────────────────────────────────
insert into public.roles (name, description, is_system) values
  ('super_admin',      'Full access, bypasses all permission checks', true),
  ('admin',            'Full admin access via permissions',           true),
  ('product_manager',  'Manage products and view dashboard',         false),
  ('viewer',           'Read-only access',                           false)
on conflict (name) do nothing;

-- ── 3. Role ↔ Permission mappings ──────────────
-- super_admin & admin get all permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
on conflict do nothing;

-- product_manager gets product + category + dashboard
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

-- viewer gets read-only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'viewer'
  and p.name in ('product.view', 'category.view', 'user.view', 'dashboard.view')
on conflict do nothing;

-- ── 4. Master admin user ───────────────────────
-- Password: admin123 (bcrypt hash, 12 rounds)
-- Change this after first login!
insert into public.users (email, password_hash, full_name, role, is_active) values
  ('admin@jewellery.com',
   '$2b$12$BSgKq3re7WRKqgFDpPXPcu9xm9odGcEPBT6ZhO5TWszgDBHB8e7Mu',
   'Master Admin',
   'super_admin',
   true)
on conflict (email) do nothing;
