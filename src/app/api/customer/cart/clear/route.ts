import { NextRequest, NextResponse } from "next/server";
import { clearCart } from "@/features/cart/services/cart-service";

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const result = await clearCart(userId);

    return NextResponse.json(
      {
        data: result.data,
        warnings: result.warnings,
        message: "Cart cleared",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
