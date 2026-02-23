# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (React Compiler enabled)
npm run lint         # ESLint (next/core-web-vitals + typescript)
npx tsx src/lib/seed-admin.ts  # Seed initial admin user
```

No test framework is configured yet.

## Architecture

Jewellery e-commerce app built with **Next.js 16 (App Router)** + **TypeScript** + **Supabase** + **Cloudinary**.

### Source Layout (`src/`)

- **`app/api/`** — REST API routes (Next.js Route Handlers)
  - `auth/` — Public: login (JWT cookie), logout, me
  - `admin/products/` and `admin/users/` — Protected CRUD endpoints
  - `upload/image/` — Cloudinary upload/delete proxy
- **`features/`** — Domain logic organized by feature
  - Each feature has a `services/` folder with Supabase query functions
  - Services are consumed by API routes, not imported directly by client components
- **`lib/`** — Shared infrastructure: Supabase clients, JWT, Cloudinary, Zod validators, utilities
- **`proxy.ts`** — Protects `/admin/*` pages and `/api/admin/*` routes via JWT verification

### Key Patterns

**Authentication**: JWT (jose, HS256) stored in HTTP-only `admin-token` cookie. Middleware verifies token and injects `x-user-id` / `x-user-email` headers for downstream route handlers. 7-day expiration.

**Database access**: Three Supabase clients in `lib/supabase/` — browser (`client.ts`), SSR (`server.ts`), and admin/service-role (`admin.ts`, bypasses RLS). Services use the admin client for CRUD operations.

**Validation**: All API inputs validated with Zod schemas defined in `lib/validators.ts`. Schemas: `loginSchema`, `productCreateSchema`, `productUpdateSchema`, `userCreateSchema`, `userUpdateSchema`, `paginationSchema`.

**API response shape**: Paginated list endpoints return `{ data: T[], pagination: { page, limit, total, totalPages } }`. Single-item endpoints return the object directly.

**Images**: Uploaded to Cloudinary via base64 data URI. Product images stored in `product_images` table with `url`, `public_id`, `is_primary`, `sort_order`. Cascade-deleted with parent product.

**Passwords**: Hashed with bcryptjs (12 salt rounds). Never exposed in responses — `sanitizeUser()` strips `password_hash`.

**Slugs**: Auto-generated from product name via `slugify()`. Collisions appended with timestamp.

### Database Tables (Supabase/PostgreSQL)

- **users** — email (unique), password_hash, full_name, phone, avatar_url, role (admin|customer), is_active
- **products** — name, slug (unique), description, price, compare_price, category, material, weight, stock, is_active
- **product_images** — product_id (FK, cascade), url, public_id, is_primary, sort_order

### Path Alias

`@/*` maps to `src/*` (configured in tsconfig.json).

### Currency

All monetary values formatted as Indian Rupee (INR) via `formatCurrency()`.

## Environment Variables

Required in `.env.local` (see `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (for seed script)

## Implementation Status

Phases 0–3 (foundation, auth API, product CRUD API, user CRUD API) are complete. Admin UI pages and storefront are not yet built. Client-side libraries (Zustand, TanStack React Query, Framer Motion, shadcn/ui) are installed but unused.
