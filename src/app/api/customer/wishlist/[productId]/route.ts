import { NextRequest, NextResponse } from "next/server";
import { removeWishlistItem } from "@/features/wishlist/services/wishlist-service";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

/**
 * DELETE /api/customer/wishlist/[productId]
 * Remove a specific product from the wishlist.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { productId } = await params;
    await removeWishlistItem(userId, productId);

    return NextResponse.json(
      { message: "Product removed from wishlist" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
