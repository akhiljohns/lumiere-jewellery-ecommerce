import { NextRequest, NextResponse } from "next/server";
import { getFeaturedProducts } from "@/features/storefront/services/storefront-service";

/**
 * GET /api/products/featured
 * Returns featured/curated products. Falls back to latest if not enough featured.
 * No authentication required.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "8", 10) || 8, 1),
      20,
    );

    const products = await getFeaturedProducts(limit);

    return NextResponse.json({ data: products }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
