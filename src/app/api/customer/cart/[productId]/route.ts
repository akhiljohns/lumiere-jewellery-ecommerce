import { NextRequest, NextResponse } from "next/server";
import { updateCartItemSchema } from "@/lib/validators";
import {
  updateCartItemQuantity,
  removeCartItem,
} from "@/features/cart/services/cart-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { productId } = await params;
    const body = await request.json();

    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await updateCartItemQuantity(
      userId,
      productId,
      parsed.data.quantity,
    );

    return NextResponse.json(
      {
        data: result.data,
        warnings: result.warnings,
        message: "Cart updated",
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { productId } = await params;
    const result = await removeCartItem(userId, productId);

    return NextResponse.json(
      {
        data: result.data,
        warnings: result.warnings,
        message: "Item removed from cart",
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
