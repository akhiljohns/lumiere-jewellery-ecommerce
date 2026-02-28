import { NextRequest, NextResponse } from "next/server";
import { addToCartSchema } from "@/lib/validators";
import {
  getCartWithItems,
  addItemToCart,
} from "@/features/cart/services/cart-service";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const result = await getCartWithItems(userId);

    return NextResponse.json(
      { data: result.data, warnings: result.warnings },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await addItemToCart(
      userId,
      parsed.data.product_id,
      parsed.data.quantity,
    );

    return NextResponse.json(
      {
        data: result.data,
        warnings: result.warnings,
        message: "Item added to cart",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Product not found"
        ? 404
        : message === "Product is not available" ||
            message === "Product is out of stock"
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
