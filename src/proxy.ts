import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { rateLimitMiddleware, rateLimitResponse, addRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrf, generateCsrfToken, setCsrfCookie, CSRF_COOKIE_NAME } from "@/lib/csrf";

/**
 * Next.js Edge Proxy
 *
 * Protects:
 *   - /admin/*   pages  → redirects to /login
 *   - /api/admin/* routes → returns 401 JSON
 *
 * Rate limits:
 *   - /api/auth/*     → auth tier (10 req / 15 min)
 *   - /api/admin/ai/* → ai tier (20 req / min)
 *   - /api/admin/*    → admin tier (100 req / min)
 *   - /api/customer/* → customer tier (60 req / min)
 */
function withCsrf(response: NextResponse, request: NextRequest): NextResponse {
  if (!request.cookies.get(CSRF_COOKIE_NAME)?.value) {
    setCsrfCookie(response, generateCsrfToken());
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const token = request.cookies.get("admin-token")?.value;

  // ── CSRF validation for mutating requests on protected routes ──
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isProtectedRoute =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/customer") ||
    pathname.startsWith("/api/auth");

  if (isMutating && isProtectedRoute) {
    if (!validateCsrf(request)) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 },
      );
    }
  }

  // ── Rate limit auth endpoints ──
  if (pathname.startsWith("/api/auth")) {
    const rl = rateLimitMiddleware(request, "auth");
    if (!rl.success) return rateLimitResponse(rl);
  }

  // ── Protect admin API routes ──
  if (pathname.startsWith("/api/admin")) {
    // Rate limit AI endpoints more aggressively
    const tier = pathname.startsWith("/api/admin/ai") ? "ai" as const : "admin" as const;
    const rl = rateLimitMiddleware(request, tier);
    if (!rl.success) return rateLimitResponse(rl);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role === "customer") {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Attach user info to headers for downstream route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub!);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);
    requestHeaders.set(
      "x-user-permissions",
      JSON.stringify(payload.permissions ?? []),
    );

    return withCsrf(
      NextResponse.next({ request: { headers: requestHeaders } }),
      request,
    );
  }

  // ── Protect customer API routes ──
  if (pathname.startsWith("/api/customer")) {
    const rl = rateLimitMiddleware(request, "customer");
    if (!rl.success) return rateLimitResponse(rl);

    const customerToken = request.cookies.get("customer-token")?.value;

    if (!customerToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const payload = await verifyToken(customerToken);
    if (!payload || payload.role !== "customer") {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub!);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);

    return withCsrf(
      NextResponse.next({ request: { headers: requestHeaders } }),
      request,
    );
  }

  // ── Protect admin pages ──
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return withCsrf(NextResponse.redirect(loginUrl), request);
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role === "customer") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return withCsrf(NextResponse.redirect(loginUrl), request);
    }

    return withCsrf(NextResponse.next(), request);
  }

  // ── Redirect authenticated admins away from login ──
  if (pathname === "/login" && token) {
    const payload = await verifyToken(token);
    if (payload && payload.role !== "customer") {
      return withCsrf(
        NextResponse.redirect(new URL("/admin/dashboard", request.url)),
        request,
      );
    }
  }

  return withCsrf(NextResponse.next(), request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/customer/:path*", "/api/auth/:path*", "/login"],
};
