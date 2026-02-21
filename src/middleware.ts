import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

/**
 * Next.js Edge Middleware
 *
 * Protects:
 *   - /admin/*   pages  → redirects to /login
 *   - /api/admin/* routes → returns 401 JSON
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin-token")?.value;

  // ── Protect admin API routes ──
  if (pathname.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Attach user info to headers for downstream route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub!);
    requestHeaders.set("x-user-email", payload.email);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Protect admin pages ──
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── Redirect authenticated admins away from login ──
  if (pathname === "/login" && token) {
    const payload = await verifyToken(token);
    if (payload && payload.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/login"],
};
