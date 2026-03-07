# Jewellery E-Commerce

A full-stack jewellery e-commerce platform with an admin panel and customer-facing storefront, built for the Indian market (INR). Features AI-powered product management, Razorpay payments, real-time inventory analytics, and a responsive storefront with advanced filtering and search.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v4, shadcn/ui (Mira style, amber theme) |
| Payments | Razorpay (online), Cash on Delivery |
| Images | Cloudinary with auto AVIF/WebP optimization |
| AI | Google Gemini 2.5 Flash (structured JSON mode) |
| Auth | JWT (jose, HS256), HTTP-only cookies |
| Email | Nodemailer (Gmail SMTP) |
| State | TanStack Query v5, Zustand, nuqs (URL state) |
| Animations | Framer Motion |
| Charts | Recharts |
| Notifications | Discord webhooks |

## Features

### Storefront

**Homepage** — Hero section, features strip, featured products grid, category showcase, and newsletter CTA. Server-rendered with Framer Motion entrance animations.

**Product Listing** — Filterable product grid with category, material, and price range filters. Supports sorting (popular, newest, price), pagination via URL state, and a quick-view modal for previewing products without leaving the page.

**Product Detail** — Image gallery with hover zoom, quantity selector, add-to-cart, breadcrumbs, and related products. Server-rendered with dynamic SEO metadata per product.

**Search** — Full-text search powered by PostgreSQL tsvector with GIN indexing. Searches across product name, description, material, and category.

**Cart** — Client-side cart with real-time stock validation. Quantity adjustment, item removal, and subtotal calculation. Guest carts merge with customer carts on login.

**Checkout** — Address selection from saved addresses or inline entry. Payment via Razorpay (online) or COD. Stock is validated at checkout to prevent overselling.

**Wishlist** — Add/remove products, view wishlist page, and move items to cart.

**Customer Account** — Registration, login, email verification, password recovery, profile management, order history, and self-service order cancellation.

### Admin Panel

**Dashboard** — Real-time overview with product stats, user metrics, revenue trends (30-day chart), top-selling products, recent orders, inventory alerts, and pricing suggestions.

**Product Management** — Full CRUD with multi-image upload (Cloudinary), primary image selection, category assignment, material/weight fields, stock tracking, featured flag, and active/inactive toggle. Slugs are auto-generated with collision handling.

**Category Management** — Hierarchical categories with parent-child relationships, sort order, category images, and active/inactive status.

**Order Management** — View all orders with status lifecycle tracking (pending > confirmed > processing > shipped > delivered). Update order status, view payment details, and see full item breakdowns with price snapshots.

**User Management** — Create, edit, and deactivate admin users. Assign roles with granular permissions.

**Role & Permission Management** — Define custom roles with fine-grained permissions (e.g., `product.create`, `order.view`). Permissions are enforced at the API layer.

**Audit Logs** — Every admin action (create, update, delete) is logged with the actor, resource, IP address, and a diff of changes. Filterable by resource type, actor, and action.

### AI Features (Gemini 2.5 Flash)

All AI functions use `responseMimeType: "application/json"` for guaranteed structured output and `thinkingConfig: { thinkingBudget: 0 }` to disable reasoning overhead on structured tasks.

**One-Click Image Analysis & Auto-Fill** — Upload one or more product images and click "Analyze with AI". The system sends all images to Gemini vision, which extracts jewellery type, metal color, gemstones, style, material, weight estimate, and a suggested price range (INR). It then auto-fills every form field: name, description (via a chained generate-description call), category (fuzzy-matched against real DB categories), material, weight, price (midpoint of AI range), and compare price (max of range). Admins can create a complete product listing from images alone.

**Product Description Generation** — Generates a compelling 2-3 sentence description, SEO meta description, and relevant tags using product context (name, category, material, price, weight). Called automatically during image analysis or available as a standalone API.

**Smart Categorization** — AI classifies products by matching against the store's actual category list from the database, with confidence scoring. Includes material suggestion from a curated list of Indian jewellery materials.

**Occasion-Based Auto-Tagging** — Generates occasion tags (wedding, festival, daily wear), style tags (traditional, modern, ethnic), and gifting tags (birthday gift, anniversary) for product merchandising.

**Image Alt Text Generation** — Creates 15-25 word accessibility descriptions for product images, optimized for screen readers and SEO.

**AI Shopping Assistant** — Multi-turn conversational chat that helps customers find products. Uses full-text search (tsvector + ILIKE) against the product database to retrieve relevant products with real prices, stock status, and direct product links. Falls back to featured products when no search matches, ensuring the AI always has catalog context to recommend from. Supports both guest and authenticated sessions with persistent conversation history.

### Analytics & Insights

**Revenue Trends** — 30-day daily revenue and order count chart on the dashboard.

**Top Selling Products** — Ranked by units sold and revenue generated.

**Inventory Alerts** — Identifies out-of-stock and low-stock products. Calculates sales velocity over the last 30 days, predicts days until stockout, and provides restock recommendations with urgency levels (critical, warning, low). Optionally sends alerts to Discord.

**Pricing Suggestions** — Analyzes product pricing and flags issues: products without a compare price, products with low discount visibility (< 5%), and products priced below category average. Provides suggested compare prices, discount percentages, and priority levels (high, medium, low). Includes category-level pricing analysis with min/max/average breakdowns.

### Payments

**Razorpay Integration** — Online payment flow with order creation, client-side payment modal, server-side signature verification, and webhook handling for payment.captured, payment.failed, and refund.processed events.

**Cash on Delivery** — Alternative payment option that creates orders in pending status with immediate confirmation email.

**Payment Tracking** — Each order tracks payment status (pending, paid, failed, refunded) and payment method independently from order status.

### Email Notifications

**Order Confirmation** — Itemized order summary with prices, shipping address, payment method, and a link to view the order. HTML-formatted with amber branding.

**Email Verification** — Token-based verification link sent on registration. 24-hour expiration with resend capability.

**Password Reset** — Secure token-based reset flow with 1-hour expiration.

### Security

**Authentication** — JWT tokens (HS256, 7-day expiry) stored in HTTP-only cookies. Middleware verifies tokens and injects user context headers for all protected routes. Separate auth flows for admin and customer.

**Authorization** — Role-based access control with a granular permission system. Each API endpoint checks specific permissions (e.g., `product.create`, `order.update`).

**Rate Limiting** — IP-based sliding window rate limiting across all API tiers: auth (10/15min), AI (20/min), admin (100/min), customer (60/min), public (120/min). Returns 429 with Retry-After header when exceeded.

**CSRF Protection** — Double-submit cookie pattern for form submissions.

**Input Sanitization** — HTML tag stripping on all user inputs. Zod schema validation on every API endpoint.

**Security Headers** — Content Security Policy and standard security headers applied via middleware.

**Webhook Verification** — Razorpay webhooks verified with HMAC SHA256 signature validation.

### Infrastructure

**Image Optimization** — Cloudinary-hosted images served with automatic AVIF/WebP format, responsive sizing, and Cloudinary-side cropping. All images rendered via a custom `CloudinaryImage` component wrapping `next-cloudinary`.

**API Response Caching** — Cache-Control headers on public endpoints. `unstable_cache` with tag-based revalidation on storefront queries. On-demand `revalidateTag` when admin mutations occur.

**Database Migrations** — Managed via Supabase CLI with versioned migration files in `supabase/migrations/`.

**Discord Notifications** — Admin actions (product created, order updated, user deleted, etc.) are sent to a Discord channel as color-coded embeds with actor, resource, and change details.

**Bundle Optimization** — `next/dynamic` lazy-loading for admin form pages. `optimizePackageImports` for lucide-react, TanStack, and Framer Motion.

**Dark Mode** — Full dark mode support via CSS variables. All theme colors use shadcn semantic tokens.

**Accessibility** — All form inputs linked to error messages via `aria-describedby`. Focus rings, labels, and color contrast (WCAG AA 4.5:1) verified across the UI.

## Getting Started

```bash
cp .env.local.example .env.local   # configure environment variables
npm install
npx tsx src/lib/seed-admin.ts      # seed initial admin user
npm run dev                        # http://localhost:3000
```

## Environment Variables

See `.env.local.example` for the full list. Key services:

| Variable Group | Purpose | Required |
|---------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database and auth | Yes |
| `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_*` | Image upload and delivery | Yes |
| `JWT_SECRET` | Token signing | Yes |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed script credentials | Yes (initial setup) |
| `SMTP_USER`, `SMTP_PASS` | Gmail SMTP for emails | Yes |
| `RAZORPAY_*`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payment processing | For checkout |
| `GEMINI_API_KEY` | AI features | For AI features |
| `DISCORD_WEBHOOK_URL` | Admin notifications | Optional |

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build (React Compiler enabled)
npm run lint             # Run ESLint
npm run db:migrate       # Push migrations to remote database
npm run db:migration:new # Create a new migration file
npm run db:reset         # Reset database and re-run all migrations
npm run db:types         # Regenerate TypeScript types from schema
npm run db:seed          # Seed initial admin user
```

## Project Structure

```
src/
  app/
    (storefront)/        # Customer-facing pages (/, /products, /cart, etc.)
    admin/               # Admin panel pages
    api/
      auth/              # Admin + customer authentication
      admin/             # Protected admin endpoints
      customer/          # Protected customer endpoints
      products/          # Public product endpoints
      categories/        # Public category endpoints
      chat/              # AI shopping assistant
      webhooks/          # Razorpay webhook handler
      upload/            # Image upload proxy
  features/              # Domain logic organized by feature
    products/            # Product CRUD, queries, components
    categories/          # Category management
    orders/              # Order management
    cart/                # Cart operations
    wishlist/            # Wishlist feature
    auth/                # Authentication logic
    dashboard/           # Dashboard widgets and analytics
    storefront/          # Storefront-specific components
    admin/               # Admin layout and shared components
    users/               # User management
    roles/               # Role and permission management
  lib/                   # Shared infrastructure
    ai.ts                # Gemini AI functions (description, categorization, image analysis)
    chat.ts              # AI shopping assistant with DB product context
    api-client.ts        # Client-side fetch wrapper
    supabase/            # Supabase clients (browser, server, admin)
    validators.ts        # Zod schemas
    email.ts             # Email templates and sending
    discord.ts           # Discord webhook integration
    razorpay.ts          # Razorpay client
    rate-limit.ts        # Rate limiting
  components/ui/         # shadcn/ui components
supabase/migrations/     # Database migration files
```
