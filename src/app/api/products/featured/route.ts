import { NextRequest, NextResponse } from "next/server";
import { getFeaturedProducts } from "@/features/storefront/services/storefront-service";
import { rateLimitMiddleware, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/products/featured
 * Returns featured/curated products. Falls back to latest if not enough featured.
 * No authentication required. Rate limited: 120 req/min.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimitMiddleware(request, "public");
    if (!rl.success) return rateLimitResponse(rl);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "8", 10) || 8, 1),
      20,
    );

    const products = await getFeaturedProducts(limit);

    return NextResponse.json({ data: products }, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
