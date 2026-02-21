## Core Principles

- **Architecture:** Feature-based directory structure only. No "flat" component folders.
- **Naming:** Kebab-case for all files/folders (`product-card.tsx`). PascalCase for Components.
- **Data Flow:** Server Components for initial load. TanStack Query for client-side interactions.
- **State:** Zustand for UI state. Nuqs for URL state. React Query for Server state.

## Tech Skills

- Supabase RLS & Database Webhooks.
- React 19 'use' hook and Server Actions.
- Tailwind CSS v4 utility-first styling.
- If a change is destructive to the schema, warn first.
- all animations should respect preferred-reduce-motion for accesibility

## Folder Structure

```
src/
 ├── app/                      # Next.js Routing & Layouts
 ├── features/                 # Feature-Based Architecture (Kebab-case)
 │    ├── product-listing/     # Logic for grid, search, and sorting
 │    │    ├── components/     # Feature-specific UI (filter-panel.tsx)
 │    │    ├── hooks/          # use-products.ts (React Query)
 │    │    ├── store/          # use-filter-store.ts (Zustand)
 │    │    └── services/       # supabase-queries.ts
 │    ├── checkout/            # Stripe/Payment integration logic
 │    └── support-chat/        # Supabase Realtime implementation
 ├── lib/                      # Core Config & Shared Utilities
 │    ├── supabase/            # Client/Server/Middleware initializers
 │    └── utils/               # cn() and shared logic
 └── components/               # Global shadcn/ui shared components
```
