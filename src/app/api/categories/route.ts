import { NextRequest, NextResponse } from "next/server";
import { getPublicCategories } from "@/features/storefront/services/storefront-service";
import { rateLimitMiddleware, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/categories
 * Public category list with product counts.
 * No authentication required. Rate limited: 120 req/min.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimitMiddleware(request, "public");
    if (!rl.success) return rateLimitResponse(rl);
    const categories = await getPublicCategories();

    return NextResponse.json({ data: categories }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
