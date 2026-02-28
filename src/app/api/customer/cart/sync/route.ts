import { NextRequest, NextResponse } from "next/server";
import { cartSyncSchema } from "@/lib/validators";
import { syncCart } from "@/features/cart/services/cart-service";

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

    const parsed = cartSyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await syncCart(userId, parsed.data.items);

    return NextResponse.json(
      {
        data: result.data,
        warnings: result.warnings,
        message: "Cart synced successfully",
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
