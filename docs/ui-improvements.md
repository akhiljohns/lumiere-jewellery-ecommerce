# UI Improvements & Component Reference

This document covers the UI architecture, component library, recent improvements, design system rules, and enhancement opportunities.

---

## 1. Design System

### Theme

- **Style**: shadcn/ui Mira
- **Primary color**: Amber (`--primary` CSS variable)
- **Base color**: Gray
- **Font**: Inter (loaded via `next/font/google`, applied as `font-sans`)
- **Dark mode**: Supported via `.dark` class toggle

### Color Rules (Strict)

Only shadcn CSS variable classes are allowed. **Never** use hardcoded hex, OKLCH, or Tailwind color scales (`zinc-*`, `red-*`, etc.).

| Use Case | Class |
|----------|-------|
| Page background | `bg-background` |
| Primary text | `text-foreground` |
| Card container | `bg-card`, `text-card-foreground` |
| Primary actions | `bg-primary`, `text-primary-foreground` |
| Secondary | `bg-secondary`, `text-secondary-foreground` |
| Muted/subtle | `bg-muted`, `text-muted-foreground` |
| Destructive/error | `bg-destructive`, `text-destructive` |
| Borders | `border-border`, `border-input` |
| Focus | `ring-ring` |

Opacity modifiers are fine: `bg-primary/10`, `text-muted-foreground/80`.

### Icons

Only `lucide-react`. Never use heroicons, react-icons, or fontawesome.

### Components

Always prefer `@/components/ui/*` (shadcn/ui). To add new ones:

```bash
npx shadcn@latest add <component>
```

---

## 2. Reusable Global Components

Located in `src/components/`. These should be used across all pages — never inline one-off equivalents.

### Loading States (`page-loader.tsx`)

| Component | Use Case | Props |
|-----------|----------|-------|
| `PageLoader` | Full-page spinner | `message?: string` |
| `TableSkeleton` | Admin table pages | `rows?: number` (default: 5) |
| `FormSkeleton` | Create/edit form pages | `fields?: number` (default: 5) |
| `DetailSkeleton` | Detail/view pages | `fields?: number`, `hasSidebar?: boolean` |

All skeleton components include `role="status"` and `aria-label` for screen readers.

**Usage in `loading.tsx` files:**

```tsx
// src/app/admin/products/loading.tsx
import { TableSkeleton } from "@/components/page-loader";

export default function Loading() {
  return <TableSkeleton rows={10} />;
}
```

### Empty States (`empty-state.tsx`)

```tsx
import { EmptyState } from "@/components/empty-state";
import { Package } from "lucide-react";

<EmptyState
  icon={Package}
  title="No products found"
  description="Try adjusting your search or filters."
>
  <Button>Create Product</Button>  {/* Optional CTA */}
</EmptyState>
```

Used in `DataTable` when there are zero rows. Storefront pages (cart, orders, profile) have their own illustrated empty states following the same pattern.

### Error Boundaries (`error-boundary-content.tsx`)

```tsx
// src/app/admin/products/error.tsx
"use client";

import { ErrorBoundaryContent } from "@/components/error-boundary-content";

export default function Error({ error, reset }) {
  return (
    <ErrorBoundaryContent
      error={error}
      reset={reset}
      backHref="/admin/products"
      backLabel="Back to Products"
    />
  );
}
```

Shows error icon, message, optional digest ID, "Try again" button, and back link. Error boundaries exist for:
- `/admin` (root)
- `/admin/products`, `/admin/orders`, `/admin/users`, `/admin/categories`
- `/(storefront)` (root)

### Data Table (`data-table.tsx`)

Wraps TanStack React Table with:
- Server-side pagination controls (first/prev/next/last)
- Loading state via `TableSkeleton`
- Empty state via `EmptyState`
- Responsive pagination (stacks vertically on mobile)

### CloudinaryImage (`cloudinary-image.tsx`)

**Always use this for Cloudinary-hosted images** — never use `next/image` directly.

```tsx
<CloudinaryImage
  src={imageUrl}
  alt={product.name}
  fill                    // or width/height for fixed size
  crop="fill"             // thumbnails
  sizes="(max-width: 640px) 50vw, 25vw"  // responsive
  className="object-cover"
/>
```

Provides auto AVIF/WebP format, Cloudinary-side resize/crop, lazy loading, and extracts `public_id` from full URLs.

### Admin Command Palette (`admin-command-palette.tsx`)

- Trigger: `Ctrl+K` / `Cmd+K`
- Shows admin page shortcuts when no query
- Searches products, users, orders in parallel with 300ms debounce
- Uses shadcn `Command` component (cmdk-based)

---

## 3. Storefront Components

Located in `src/features/storefront/components/`.

### Navigation

| Component | Description |
|-----------|-------------|
| `StorefrontNavbar` | Logo, nav links, search, cart badge, user menu, mobile hamburger Sheet |
| `StorefrontFooter` | Footer with links and branding |
| `SearchOverlay` | Full-screen search modal with live results |
| `ChatWidget` | Floating AI chat assistant (bottom-right) |

### Product Display

| Component | Description |
|-----------|-------------|
| `ProductCard` | Grid card with image, name, category, price, wishlist, quick-view |
| `PriceDisplay` | Price with optional strikethrough compare price and discount badge |
| `WishlistButton` | Heart toggle with optimistic UI |
| `AddToCartButton` | Cart button with quantity selector and stock validation |
| `ProductCardSkeleton` | Loading placeholder for product cards |

### Product Detail (`detail/`)

| Component | Description |
|-----------|-------------|
| `ProductImageGallery` | Main image + thumbnails, arrow navigation, keyboard (ArrowLeft/Right), swipe gestures, zoom-on-hover, image counter |
| `ProductInfoSection` | Name, description, material, weight, stock status |
| `AddToCartSection` | Quantity picker + add to cart |
| `ProductBreadcrumbs` | Category > Product breadcrumb trail |
| `RelatedProducts` | Grid of related products from same category |

### Product Listing (`listing/`)

| Component | Description |
|-----------|-------------|
| `ProductListingClient` | Main container with filters, sort, grid, pagination |
| `FilterSidebar` | Category, material, price range filters (desktop sidebar + mobile Sheet) |
| `SortControls` | Sort dropdown (newest, price, name) + product count |
| `ProductGrid` | Responsive grid (2-col mobile, 3-col tablet, 4-col desktop) |
| `PaginationControls` | Page navigation |
| `QuickViewModal` | Product preview dialog |

### Homepage (`home/`)

| Component | Description |
|-----------|-------------|
| `HeroSection` | Full-width hero banner with CTA |
| `FeaturedProductsSection` | Horizontal scroll carousel of featured products |
| `CategoryGridSection` | Grid of category cards with images and product counts |
| `CategoryCard` | Individual category with glassmorphism overlay |
| `HomepageSkeleton` | Loading state for entire homepage |

---

## 4. Animation System

### Framer Motion Presets (`motion-variants.ts`)

```ts
import { fadeInUp, staggerContainer, staggerItem, cardHover } from "./motion-variants";
```

| Variant | Effect | Usage |
|---------|--------|-------|
| `fadeInUp` | Fade in + slide up 20px | Section headings, hero content |
| `staggerContainer` | Parent that staggers children by 60ms | Product grids, category grids |
| `staggerItem` | Child fade + slide up 15px | Individual cards in grids |
| `cardHover` | Spring lift (-4px) + tap scale (0.98) | ProductCard, CategoryCard |

**Usage pattern:**

```tsx
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={staggerItem} {...cardHover}>
      <Card />
    </motion.div>
  ))}
</motion.div>
```

### AnimatePresence

Used for enter/exit animations on:
- Chat widget open/close
- Quick-view modal
- Image gallery transitions
- Search overlay

---

## 5. Recent Phase C Improvements

### TASK-C09 — Admin Order Management
- Order list with status/payment filters
- Order detail with status timeline visualization
- Status update with valid transition enforcement

### TASK-C11 — Admin Audit Log UI
- Action/resource filters, search
- Color-coded action badges (created/updated/deleted)

### TASK-C12 — Optimistic Updates
- Delete mutations (products, users, categories): instant removal + rollback on error
- Wishlist toggle: instant flip + server reconciliation
- Cart operations: toast feedback on remove/clear

### TASK-C13 — Command Palette (Cmd+K)
- Unified search across products, users, orders
- Navigation shortcuts for all admin pages
- 300ms debounced API queries

### TASK-C14 — Product Gallery Enhancements
- Arrow key navigation
- Touch swipe gestures (50px threshold)
- Prev/next hover buttons
- Image counter badge

### TASK-C15 — RSC Streaming & Skeletons
- `loading.tsx` for all admin routes (dashboard, products, orders, categories, users, roles, audit-logs)
- `loading.tsx` for storefront routes (products, cart, checkout, profile, orders)

### TASK-C16 — Framer Motion Animations
- Spring hover on ProductCard and CategoryCard
- Stagger animations on grids

### TASK-C17 — AI Buttons in Product Form
- "Generate" button next to description (Sparkles icon, calls Gemini)
- "Suggest" button next to category (auto-fills category + material)
- Loading spinners during generation

### TASK-C18 — AI Chat Widget
- Floating button (bottom-right) with spring animation
- Chat panel with message bubbles, typing indicator
- Suggestion chips for quick prompts
- Connected to RAG backend (`POST /api/chat`)

### TASK-C19 — Responsive Design Audit
- Fixed-width selects made responsive (`w-full sm:w-[Npx]`)
- Filter rows use `flex-wrap` for mobile
- DataTable pagination stacks vertically on small screens
- Checkout step indicator wraps on mobile

### TASK-C20 — Accessibility
- Skip-to-content links in admin and storefront layouts
- `aria-current="page"` on active sidebar and navbar links
- `role="status"` on all skeleton/loader components
- All product images use `product.name` as alt text

### TASK-C21 — Empty States
- Reusable `EmptyState` component (icon + title + description + CTA slot)
- Enhanced DataTable empty state

### TASK-C22 — Error Boundaries
- `ErrorBoundaryContent` component (error icon, message, digest, retry, back link)
- `error.tsx` files for admin and storefront route segments

### TASK-C23 — Inventory Alerts Widget
- Dashboard card showing out-of-stock, critical/warning restock, low stock items
- Days-until-stockout predictions based on sales velocity

### TASK-C24 — Pricing Suggestions Widget
- Dashboard card showing products needing pricing attention
- Priority badges (high/medium/low)
- Current vs suggested compare prices with discount %
- Links to product edit pages

---

## 6. Admin Page Patterns

### List Page Pattern

```
"use client" → nuqs URL state (page, search, filters)
→ React Query hook (useGetX)
→ Debounced search (400ms)
→ DataTable + column definitions
→ ConfirmDialog for deletes
```

### Detail Page Pattern

```
useParams() → useGetX(id) hook
→ DetailSkeleton while loading
→ ErrorState on error
→ PageHeader + Card with DetailField grid
→ Action buttons (edit, delete)
```

### Form Page Pattern

```
useForm (react-hook-form) + zodResolver
→ Controller for Select/Checkbox fields
→ FieldGroup > Field > FieldLabel + Input + FieldError
→ aria-describedby linking inputs to errors
→ Submit → mutation hook → toast → redirect
```

---

## 7. Future Improvement Opportunities

### High Impact
- **Virtual scrolling** for large product grids (TanStack Virtual)
- **Image drag-and-drop reorder** in product form
- **Inline editing** in DataTable cells
- **Dashboard filter** for date ranges on charts

### Medium Impact
- **Skeleton improvements**: match actual content layout more closely
- **Transition animations** between pages (View Transitions API)
- **Table column visibility toggle** for admin tables
- **Bulk actions** in admin tables (select multiple, bulk delete/status change)

### Low Impact / Polish
- **Micro-interactions**: button ripple effects, checkbox animations
- **Empty state illustrations**: SVG illustrations instead of just icons
- **Onboarding tour**: first-time admin setup wizard
- **Keyboard shortcuts help modal**: show all available shortcuts
