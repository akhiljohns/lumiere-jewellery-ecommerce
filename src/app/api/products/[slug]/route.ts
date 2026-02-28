import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/features/storefront/services/storefront-service";

/**
 * GET /api/products/:slug
 * Public product detail with images, category, and related products.
 * No authentication required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const result = await getProductBySlug(slug);

    if (!result) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { data: result.product, related: result.related },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
