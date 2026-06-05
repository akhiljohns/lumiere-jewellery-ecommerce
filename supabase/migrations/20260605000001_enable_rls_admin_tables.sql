-- Enable Row Level Security on admin-only tables flagged by the Supabase
-- Security Advisor ("RLS Disabled in Public").
--
-- These tables are accessed exclusively via the service-role (admin) client,
-- which BYPASSES RLS. Enabling RLS with NO policies therefore keeps all
-- server-side access working while denying every anon/authenticated request
-- made directly through the public PostgREST API with the (public) anon key.

alter table public.roles            enable row level security;
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;
alter table public.media            enable row level security;
