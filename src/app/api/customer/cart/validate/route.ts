import { NextRequest, NextResponse } from "next/server";
import { validateCartForCheckout } from "@/features/cart/services/cart-service";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const result = await validateCartForCheckout(userId);

    return NextResponse.json(
      {
        data: result.data,
        warnings: result.warnings,
        message:
          result.warnings.length > 0
            ? "Cart adjusted. Please review before checkout."
            : "Cart is valid for checkout",
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
