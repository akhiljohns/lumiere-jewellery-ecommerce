import { NextRequest, NextResponse } from "next/server";
import { wishlistToggleSchema } from "@/lib/validators";
import {
  getWishlist,
  toggleWishlistItem,
} from "@/features/wishlist/services/wishlist-service";

/**
 * GET /api/customer/wishlist
 * List all wishlisted products for the authenticated customer.
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

    const items = await getWishlist(userId);
    return NextResponse.json({ data: items }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/customer/wishlist
 * Toggle a product in the wishlist (add if not present, remove if present).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const parsed = wishlistToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await toggleWishlistItem(userId, parsed.data.product_id);

    return NextResponse.json(
      {
        data: result,
        message: result.added
          ? "Product added to wishlist"
          : "Product removed from wishlist",
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status =
      message === "Product not found"
        ? 404
        : message === "Product is not available"
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
