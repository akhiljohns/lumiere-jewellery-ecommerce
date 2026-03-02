# Environment Setup Guide

Step-by-step instructions for obtaining all API keys, secrets, and configuring the `.env.local` file.

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd jewellery-ecommerce
npm install

# 2. Copy env template
cp .env.local.example .env.local

# 3. Fill in all values (see sections below)

# 4. Push database migrations
npx supabase link --project-ref <your-project-ref>
npm run db:migrate

# 5. Seed admin user
npx tsx src/lib/seed-admin.ts

# 6. Start dev server
npm run dev
```

---

## 1. Supabase (Database & Auth)

Supabase provides the PostgreSQL database, RLS policies, and real-time capabilities.

### Get Your Keys

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New Project** — choose an organization, set a name, database password, and region.
3. Wait for the project to provision (~2 minutes).
4. Go to **Project Settings** > **API** (left sidebar under Configuration).
5. You'll see:
   - **Project URL** — this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon (public)** key — this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role (secret)** key — this is `SUPABASE_SERVICE_ROLE_KEY`

6. For `DATABASE_URL`, go to **Project Settings** > **Database** > **Connection string** > **URI** tab. Copy the URI and replace `[YOUR-PASSWORD]` with your database password.

### Set in `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
```

### Run Migrations

Install the Supabase CLI if you haven't:

```bash
npm install -g supabase
```

Link to your project and push migrations:

```bash
npx supabase link --project-ref <your-project-ref>
npm run db:migrate
```

The project ref is the subdomain in your Supabase URL (e.g., `xxxxxxxxxxxx` from `xxxxxxxxxxxx.supabase.co`).

> **Important**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security. Never expose it to the client. It is only used in server-side service functions (`src/lib/supabase/admin.ts`).

---

## 2. Cloudinary (Image Hosting)

Cloudinary handles product image uploads, transformations, and CDN delivery.

### Get Your Keys

1. Go to [cloudinary.com](https://cloudinary.com) and sign up (free tier: 25GB storage, 25GB bandwidth/month).
2. From the **Dashboard**, note your:
   - **Cloud Name** — this is both `CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** — this is `CLOUDINARY_API_KEY`
   - **API Secret** — this is `CLOUDINARY_API_SECRET`

3. **Create an Upload Preset** (required for client-side uploads):
   - Go to **Settings** > **Upload** > **Upload presets**.
   - Click **Add upload preset**.
   - Set **Signing Mode** to **Unsigned**.
   - Set **Folder** to `jewellery-ecommerce/products` (recommended).
   - Save. The preset name is `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

### Set in `.env.local`

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdef...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
```

> The `NEXT_PUBLIC_` prefixed variables are exposed to the browser for the `<CloudinaryImage>` component and client-side upload widget. The API secret is server-side only.

---

## 3. JWT Secret

Used for signing admin and customer authentication tokens.

### Generate a Secret

Run this in your terminal:

```bash
openssl rand -base64 48
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

The secret must be at least **32 characters** long.

### Set in `.env.local`

```env
JWT_SECRET=your-generated-secret-at-least-32-chars
```

> This signs HTTP-only cookies (`admin-token`, `customer-token`) with HS256 via the `jose` library. Keep it secret — if compromised, rotate it immediately (all users will be logged out).

---

## 4. Gmail SMTP (Transactional Email)

Used for email verification, password reset, and order confirmation emails.

### Get a Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com).
2. Navigate to **Security** > **2-Step Verification** (enable it if not already).
3. At the bottom of the 2-Step Verification page, click **App passwords**.
4. Select **App**: Mail, **Device**: Other (type "Jewellery Store").
5. Click **Generate**. Copy the 16-character password.

> **Note**: You must have 2-Step Verification enabled to use App Passwords. Regular Gmail passwords will not work with SMTP.

### Set in `.env.local`

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Jewellery Store
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `SMTP_USER` — your Gmail address
- `SMTP_PASS` — the 16-character App Password (with spaces is fine)
- `SMTP_FROM_NAME` — display name in the "From" field
- `NEXT_PUBLIC_APP_URL` — base URL for links in emails (set to your production URL in prod)

### Emails Sent by the System

| Email | Trigger | Template |
|-------|---------|----------|
| Verification | Customer registration | Link to `/verify-email?token=...` |
| Password reset | Forgot password | Link to `/reset-password?token=...` |
| Order confirmation | Order placed | Order details with items and total |

---

## 5. Razorpay (Payment Gateway)

Razorpay handles online payments (UPI, cards, net banking) for the Indian market. COD (Cash on Delivery) works without Razorpay.

### Get Your Keys

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com) and sign up.
2. For development, use **Test Mode** (toggle at the top of the dashboard).
3. Go to **Settings** > **API Keys**.
4. Click **Generate Key** to create a new key pair.
5. Note:
   - **Key ID** (starts with `rzp_test_`) — this is both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** — this is `RAZORPAY_KEY_SECRET`

6. **Set up Webhook**:
   - Go to **Settings** > **Webhooks**.
   - Click **Add New Webhook**.
   - Set URL to: `https://your-domain.com/api/webhooks/razorpay`
   - Select events: `payment.captured`, `payment.failed`, `order.paid`
   - Set a webhook secret — this is `RAZORPAY_WEBHOOK_SECRET`

### Set in `.env.local`

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

### Test Cards (Test Mode)

| Card Number | Behavior |
|-------------|----------|
| `4111 1111 1111 1111` | Success |
| `4000 0000 0000 0002` | Decline |

Use any future expiry date and any 3-digit CVV.

> **For production**: Switch to Live Mode in the Razorpay dashboard, complete KYC verification, and regenerate keys. Update all env vars with live keys.

---

## 6. Google Gemini AI

Powers AI features: product description generation, category suggestions, image analysis, alt text generation, and the RAG chatbot.

### Get Your API Key

1. Go to [aistudio.google.com](https://aistudio.google.com).
2. Sign in with your Google account.
3. Click **Get API Key** in the left sidebar (or go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)).
4. Click **Create API Key**.
5. Choose an existing Google Cloud project or create a new one.
6. Copy the generated API key.

### Set in `.env.local`

```env
GEMINI_API_KEY=AIzaSy...
```

### AI Features Using This Key

| Feature | API Endpoint | What It Does |
|---------|-------------|--------------|
| Generate Description | `POST /api/admin/ai/generate-description` | Writes a 2-3 sentence product description + SEO meta + tags |
| Suggest Category | `POST /api/admin/ai/suggest-category` | Auto-categorizes product + suggests material |
| Generate Alt Text | `POST /api/admin/ai/generate-alt-text` | Creates accessible alt text from product images |
| Auto-Tag | `POST /api/admin/ai/auto-tag` | Generates occasion/style/gifting tags |
| Analyze Image | `POST /api/admin/ai/analyze-image` | Visual search — detects metal, gemstones, style |
| RAG Chatbot | `POST /api/chat` | Shopping assistant with product knowledge |

### Rate Limits & Pricing

- **Free tier**: 15 requests/minute, 1 million tokens/minute, 1,500 requests/day
- **Model used**: `gemini-2.0-flash` (fast, cost-effective)
- The app has a built-in rate limiter: 20 AI requests/minute per IP

> **Optional**: If you don't need AI features, you can leave `GEMINI_API_KEY` empty. The app will continue to work — AI buttons will show errors but won't crash.

---

## 7. Discord Webhook (Admin Notifications)

Sends real-time notifications to a Discord channel when admin actions occur (product created, user deleted, etc.).

### Get Your Webhook URL

1. Open Discord and go to the server where you want notifications.
2. Right-click the target channel > **Edit Channel**.
3. Go to **Integrations** > **Webhooks**.
4. Click **New Webhook**.
5. Name it (e.g., "Jewellery Admin Alerts"), optionally set an avatar.
6. Click **Copy Webhook URL**.

### Set in `.env.local`

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/abcdef...
```

### What Gets Logged

| Action | Color | Example |
|--------|-------|---------|
| Created | Green | "Product 'Gold Ring' created by admin@example.com" |
| Updated | Orange | "User email changed from X to Y" with field diff |
| Deleted | Red | "Category 'Rings' deleted by admin@example.com" |

> **Optional**: If empty, Discord notifications are silently skipped. Audit logs are still persisted to the database regardless.

---

## 8. Admin Seed Account

The initial admin user for first-time setup.

### Set in `.env.local`

```env
ADMIN_EMAIL=admin@jewellery.com
ADMIN_PASSWORD=your-secure-password
```

### Run the Seed

```bash
npx tsx src/lib/seed-admin.ts
```

This creates (or updates) a user with `role='admin'` in the database. The password is hashed with bcryptjs (12 salt rounds).

> After seeding, you can log in at `/login` with these credentials to access the admin panel at `/admin/dashboard`.

---

## 9. Complete `.env.local` Template

```env
# ── Supabase ──────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:password@host:6543/postgres

# ── Cloudinary ────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# ── JWT ───────────────────────────────
JWT_SECRET=your-64-char-secret

# ── Email (Gmail) ─────────────────────
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Jewellery Store
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Razorpay ──────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx

# ── Discord (optional) ───────────────
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# ── Gemini AI (optional) ─────────────
GEMINI_API_KEY=AIzaSy...

# ── Admin Seed ────────────────────────
ADMIN_EMAIL=admin@jewellery.com
ADMIN_PASSWORD=your-password
```

---

## 10. Environment Validation

The app validates environment variables at startup using Zod (`src/lib/env.ts`).

### Required Variables (app won't start without these)

- `NEXT_PUBLIC_SUPABASE_URL` — must be a valid URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — must be non-empty
- `SUPABASE_SERVICE_ROLE_KEY` — must be non-empty
- `JWT_SECRET` — must be at least 32 characters
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — must be non-empty

### Optional Variables (features degrade gracefully)

- `GEMINI_API_KEY` — AI features disabled if missing
- `DISCORD_WEBHOOK_URL` — notifications silently skipped
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — online payments disabled, COD still works
- `SMTP_USER` / `SMTP_PASS` — email sending fails silently

### Validation Error Example

If required variables are missing, you'll see:

```
Environment validation failed:
  NEXT_PUBLIC_SUPABASE_URL: Required
  JWT_SECRET: String must contain at least 32 character(s)

See .env.local.example for required variables.
```

---

## 11. Production Deployment Checklist

When deploying to Vercel/Netlify/other platforms:

1. Set all env vars in the platform's dashboard (not just `.env.local`)
2. Switch Razorpay to **Live Mode** and use production keys
3. Set `NEXT_PUBLIC_APP_URL` to your production domain
4. Set up Razorpay webhook pointing to `https://yourdomain.com/api/webhooks/razorpay`
5. Ensure `JWT_SECRET` is unique per environment (don't share dev/prod secrets)
6. Verify Supabase RLS policies are correct for production
7. Set Cloudinary upload preset to **Signed** mode for production (more secure)
8. Test email delivery with production SMTP credentials
