# Jewellery E-Commerce

A full-stack jewellery e-commerce platform with an admin panel and customer storefront, built for the Indian market (INR).

## Tech Stack

Next.js 16 | TypeScript | Supabase (PostgreSQL) | Cloudinary | Razorpay | Gemini AI

## Features

### Admin Panel
- Dashboard with real-time stats (products, users, orders, revenue, inventory)
- Product management with image uploads, categories, and inventory tracking
- Category management with parent-child hierarchy
- User and role management with granular permissions
- Order management with status lifecycle tracking
- AI-powered product description and image alt text generation
- Unified search across products, users, and orders
- Discord webhook notifications for admin actions

### Customer API
- Registration, login, email verification, and password recovery
- Shopping cart with stock validation
- Multi-address management
- Checkout with Razorpay (online) and COD payment options
- Order history and self-service cancellation
- Wishlist (toggle, list, batch check)

### Public Storefront API
- Product listing with filtering (category, material, price range), sorting, and pagination
- Product detail by slug with related products
- Featured / curated products
- Full-text search powered by PostgreSQL tsvector
- Category listing with product counts

### Security
- JWT authentication with HTTP-only cookies (admin + customer)
- Role-based access control with permission system
- IP-based rate limiting across all API tiers
- Razorpay webhook signature verification
- Atomic checkout with stock locking to prevent overselling

## Getting Started

```bash
cp .env.local.example .env.local   # configure environment variables
npm install
npm run dev                        # http://localhost:3000
```

## Environment Variables

See `.env.local.example` for the full list. Key services required:

- **Supabase** — database and auth
- **Cloudinary** — image storage
- **Razorpay** — payment processing (optional, for checkout)
- **Gmail SMTP** — transactional emails
- **Gemini API** — AI generation (optional)
- **Discord Webhook** — admin notifications (optional)
