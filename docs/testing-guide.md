# Testing Guide

This document outlines the testing strategy, setup instructions, and conventions for the Jewellery E-Commerce project.

## Current Status

No test framework is configured yet (TASK-B10 is pending). This guide serves as the blueprint for setting up and writing tests.

---

## 1. Recommended Stack

| Tool | Purpose | Why |
|------|---------|-----|
| **Vitest** | Unit & integration tests | Fast, native ESM, works with Next.js out of the box |
| **React Testing Library** | Component tests | Tests user behavior, not implementation details |
| **MSW (Mock Service Worker)** | API mocking | Intercepts fetch at the network level — works with `fetchApi` |
| **Playwright** | End-to-end tests | Cross-browser, reliable, supports Next.js App Router |

---

## 2. Unit & Component Testing (Vitest)

### 2.1 Installation

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

### 2.2 Configuration

Create `vitest.config.ts` at project root:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/test/**",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/components/ui/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 2.3 Setup File

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

### 2.4 Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 2.5 What to Test

#### Validators (`src/lib/validators.ts`)

Pure Zod schemas — highest ROI tests. No mocking needed.

```ts
// src/lib/__tests__/validators.test.ts
import { describe, it, expect } from "vitest";
import { productCreateSchema, loginSchema } from "@/lib/validators";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "securepassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "test" });
    expect(result.success).toBe(false);
  });
});

describe("productCreateSchema", () => {
  it("rejects negative price", () => {
    const result = productCreateSchema.safeParse({
      name: "Ring",
      price: -100,
      stock: 5,
      is_active: true,
    });
    expect(result.success).toBe(false);
  });
});
```

#### Utility Functions (`src/lib/utils.ts`)

```ts
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency, slugify, getPrimaryImage } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats INR with rupee symbol", () => {
    expect(formatCurrency(1500)).toContain("1,500");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
});

describe("slugify", () => {
  it("converts name to slug", () => {
    expect(slugify("Diamond Ring 18K")).toBe("diamond-ring-18k");
  });
});

describe("getPrimaryImage", () => {
  it("returns the primary image", () => {
    const images = [
      { url: "a.jpg", public_id: "a", is_primary: false, sort_order: 0 },
      { url: "b.jpg", public_id: "b", is_primary: true, sort_order: 1 },
    ];
    expect(getPrimaryImage(images)?.public_id).toBe("b");
  });

  it("returns first image when no primary set", () => {
    const images = [
      { url: "a.jpg", public_id: "a", is_primary: false, sort_order: 0 },
    ];
    expect(getPrimaryImage(images)?.public_id).toBe("a");
  });
});
```

#### API Error Handling (`src/lib/errors.ts`)

```ts
// src/lib/__tests__/errors.test.ts
import { describe, it, expect } from "vitest";
import { AppError, ErrorCode } from "@/lib/errors";

describe("AppError", () => {
  it("creates error with correct status code", () => {
    const err = new AppError(ErrorCode.NOT_FOUND, "Not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
  });
});
```

#### React Components

Use React Testing Library to test user-facing behavior:

```ts
// src/features/storefront/components/__tests__/price-display.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriceDisplay } from "../price-display";

describe("PriceDisplay", () => {
  it("shows price", () => {
    render(<PriceDisplay price={2500} comparePrice={null} size="sm" />);
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  it("shows compare price with strikethrough", () => {
    render(<PriceDisplay price={2000} comparePrice={3000} size="sm" />);
    expect(screen.getByText(/3,000/)).toBeInTheDocument();
    expect(screen.getByText(/2,000/)).toBeInTheDocument();
  });
});
```

### 2.6 MSW Setup for API Mocking

Create `src/test/mocks/handlers.ts`:

```ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/products", () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "Gold Ring", slug: "gold-ring", price: 5000, stock: 10 },
      ],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
  }),

  http.get("/api/categories", () => {
    return HttpResponse.json({
      data: [{ id: "1", name: "Rings", slug: "rings" }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  }),
];
```

Create `src/test/mocks/server.ts`:

```ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

Update `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

---

## 3. End-to-End Testing (Playwright)

### 3.1 Installation

```bash
npm install -D @playwright/test
npx playwright install
```

### 3.2 Configuration

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3.3 Key E2E Flows to Test

```
e2e/
  admin-login.spec.ts        # Admin login + redirect to dashboard
  product-crud.spec.ts       # Create, edit, delete product
  category-crud.spec.ts      # Create, edit category
  customer-auth.spec.ts      # Register, verify email, login, forgot password
  storefront-browse.spec.ts  # Browse products, filter, search, view detail
  cart-checkout.spec.ts      # Add to cart, checkout, COD order
  responsive.spec.ts         # Mobile viewport tests (320px, 480px)
```

Example E2E test:

```ts
// e2e/admin-login.spec.ts
import { test, expect } from "@playwright/test";

test("admin can login and see dashboard", async ({ page }) => {
  await page.goto("/admin");
  // Should redirect to login
  await expect(page).toHaveURL(/\/login/);

  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL!);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.locator("h1")).toContainText("Dashboard");
});
```

### 3.4 Package Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## 4. Testing Conventions

### File Naming

| Type | Pattern | Location |
|------|---------|----------|
| Unit tests | `*.test.ts` | Co-located in `__tests__/` folders |
| Component tests | `*.test.tsx` | Co-located in `__tests__/` folders |
| E2E tests | `*.spec.ts` | Top-level `e2e/` directory |

### Test Structure

```ts
describe("FeatureName", () => {
  describe("happy path", () => {
    it("does the expected thing", () => { ... });
  });

  describe("edge cases", () => {
    it("handles empty input", () => { ... });
  });

  describe("error handling", () => {
    it("rejects invalid data", () => { ... });
  });
});
```

### Priority Order for Writing Tests

1. **Validators & schemas** — Pure functions, highest ROI
2. **Utility functions** — `formatCurrency`, `slugify`, `getPrimaryImage`, etc.
3. **Error handling** — `AppError`, `errorResponse`
4. **Service functions** — With MSW mocking Supabase calls
5. **React components** — User interaction and rendering
6. **E2E flows** — Critical paths (auth, checkout, CRUD)

---

## 5. CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test & Build

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint-and-build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    needs: lint-and-build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

---

## 6. Coverage Goals

| Area | Target | Notes |
|------|--------|-------|
| Validators | 95%+ | Pure schemas, easy to cover |
| Utilities | 90%+ | Pure functions |
| Services | 70%+ | Requires MSW for Supabase mocking |
| Components | 60%+ | Focus on user interaction, not styling |
| E2E | Critical paths | Auth, checkout, product CRUD |
| Overall | 70%+ | Realistic for a mid-size project |
