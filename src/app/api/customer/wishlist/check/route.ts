import { NextRequest, NextResponse } from "next/server";
import {
  isProductWishlisted,
  getWishlistedProductIds,
} from "@/features/wishlist/services/wishlist-service";

/**
 * GET /api/customer/wishlist/check?product_id=xxx
 * GET /api/customer/wishlist/check?product_ids=xxx,yyy,zzz
 *
 * Check if one or multiple products are in the customer's wishlist.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);

    // Single product check
    const productId = searchParams.get("product_id");
    if (productId) {
      const wishlisted = await isProductWishlisted(userId, productId);
      return NextResponse.json(
        { data: { product_id: productId, wishlisted } },
        { status: 200 },
      );
    }

    // Multiple products check
    const productIdsParam = searchParams.get("product_ids");
    if (productIdsParam) {
      const productIds = productIdsParam.split(",").filter(Boolean);
      const wishlistedIds = await getWishlistedProductIds(userId, productIds);
      return NextResponse.json(
        { data: { wishlisted_product_ids: wishlistedIds } },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "product_id or product_ids query parameter is required" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
