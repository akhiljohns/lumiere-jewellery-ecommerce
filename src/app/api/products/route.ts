import { NextRequest, NextResponse } from "next/server";
import { publicProductQuerySchema } from "@/lib/validators";
import { getPublicProducts } from "@/features/storefront/services/storefront-service";
import { rateLimitMiddleware, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/products
 * Public product listing with pagination, sorting, and filtering.
 * No authentication required. Rate limited: 120 req/min.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimitMiddleware(request, "public");
    if (!rl.success) return rateLimitResponse(rl);
    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
      category_id: searchParams.get("category_id") ?? undefined,
      category_slug: searchParams.get("category_slug") ?? undefined,
      material: searchParams.get("material") ?? undefined,
      min_price: searchParams.get("min_price") ?? undefined,
      max_price: searchParams.get("max_price") ?? undefined,
      is_featured: searchParams.get("is_featured") ?? undefined,
    };

    const parsed = publicProductQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await getPublicProducts(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
