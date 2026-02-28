# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (React Compiler enabled)
npm run lint         # ESLint (next/core-web-vitals + typescript)
npx tsx src/lib/seed-admin.ts  # Seed initial admin user

# Database (Supabase CLI)
npm run db:migrate          # Push migrations to remote DB (supabase db push)
npm run db:migration:new    # Create a new migration file (e.g. npm run db:migration:new add_carts)
npm run db:migration:list   # List migration status
npm run db:reset            # Reset DB and re-run all migrations
npm run db:diff             # Diff local schema against remote
npm run db:types            # Regenerate TypeScript types from DB schema
```

No test framework is configured yet.

**Database Migrations**: Managed via Supabase CLI. Migration files live in `supabase/migrations/` with timestamp prefixes. Link to your remote project first with `npx supabase link --project-ref <ref>`.

## Architecture

Jewellery e-commerce app built with **Next.js 16 (App Router)** + **TypeScript** + **Supabase** + **Cloudinary**.

### Source Layout (`src/`)

- **`app/api/`** — REST API routes (Next.js Route Handlers)
  - `auth/` — Public: login (JWT cookie), logout, me
  - `admin/products/`, `admin/categories/`, and `admin/users/` — Protected CRUD endpoints
  - `upload/image/` — Cloudinary upload/delete proxy
- **`features/`** — Domain logic organized by feature
  - Each feature has a `services/` folder with Supabase query functions
  - Services are consumed by API routes, not imported directly by client components
- **`lib/`** — Shared infrastructure: Supabase clients, JWT, Cloudinary, Zod validators, utilities
- **`proxy.ts`** — Protects `/admin/*` pages and `/api/admin/*` routes via JWT verification

### Key Patterns

**Authentication**: JWT (jose, HS256) stored in HTTP-only `admin-token` cookie. Middleware verifies token and injects `x-user-id` / `x-user-email` headers for downstream route handlers. 7-day expiration.

**Database access**: Three Supabase clients in `lib/supabase/` — browser (`client.ts`), SSR (`server.ts`), and admin/service-role (`admin.ts`, bypasses RLS). Services use the admin client for CRUD operations.

**Validation**: All API inputs validated with Zod schemas defined in `lib/validators.ts`. Schemas: `loginSchema`, `productCreateSchema`, `productUpdateSchema`, `categoryCreateSchema`, `categoryUpdateSchema`, `userCreateSchema`, `userUpdateSchema`, `paginationSchema`.

**API response shape**: Paginated list endpoints return `{ data: T[], pagination: { page, limit, total, totalPages } }`. Single-item endpoints return the object directly.

**Images**: Uploaded to Cloudinary via base64 data URI. Product images stored in `product_images` table with `url`, `public_id`, `is_primary`, `sort_order`. Cascade-deleted with parent product.

**Passwords**: Hashed with bcryptjs (12 salt rounds). Never exposed in responses — `sanitizeUser()` strips `password_hash`.

**Slugs**: Auto-generated from product/category name via `slugify()`. Collisions appended with timestamp.

### Database Tables (Supabase/PostgreSQL)

- **users** — email (unique), password_hash, full_name, phone, avatar_url, role (admin|customer), is_active
- **categories** — name, slug (unique), parent_id (self-FK, SET NULL), image_url, sort_order, is_active
- **products** — name, slug (unique), description, price, compare_price, category_id (FK→categories, SET NULL), material, weight, stock, is_active
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

## UI Theme & Styling Rules (STRICT)

The project uses **shadcn/ui Mira style** with **amber primary**, **gray base color**, and **Inter font**.

### Mandatory Rules

1. **Colors**: ONLY use shadcn CSS variable colors via Tailwind classes. NEVER use hardcoded hex values, OKLCH literals, or Tailwind color scales (zinc-*, slate-*, gray-*, stone-*, neutral-*, red-*, blue-*, etc.) in components or pages. The only allowed color classes are:
   - `bg-background`, `text-foreground` — page/section backgrounds and text
   - `bg-card`, `text-card-foreground` — card containers
   - `bg-primary`, `text-primary-foreground` — primary actions and accents (amber)
   - `bg-secondary`, `text-secondary-foreground` — secondary elements
   - `bg-muted`, `text-muted-foreground` — muted/subtle elements
   - `bg-accent`, `text-accent-foreground` — accents (same as primary in this theme)
   - `bg-destructive`, `text-destructive` — error/danger states
   - `border-border`, `border-input` — borders
   - `ring-ring` — focus rings
   - Opacity modifiers are allowed (e.g., `bg-primary/10`, `text-muted-foreground/80`)

2. **Icons**: ONLY use `lucide-react` icons. Never use other icon libraries (heroicons, react-icons, fontawesome, etc.).

3. **Font**: Inter is the sole typeface, loaded via `next/font/google` and set as `--font-inter`. Use `font-sans` to apply it. Never import or reference Geist or other fonts.

4. **Components**: Always prefer shadcn/ui components (`@/components/ui/*`). When adding new components, use `npx shadcn@latest add <component>`.

5. **shadcn config**: Style is `base-mira`, base color is `gray`, icon library is `lucide`. See `components.json`.

6. **Dark mode**: Supported via `.dark` class. All theme variables have dark mode counterparts. Use the `dark:` variant only when the CSS variable approach doesn't automatically handle it (rare).

## Implementation Status

Phases 0–3 (foundation, auth API, product CRUD API, user CRUD API) are complete. Admin UI pages and storefront are not yet built. Client-side libraries (Zustand, TanStack React Query, Framer Motion, shadcn/ui) are installed but unused.
