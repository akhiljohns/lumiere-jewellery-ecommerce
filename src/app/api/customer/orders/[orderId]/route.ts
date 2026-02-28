import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/features/orders/services/order-service";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { orderId } = await params;
    const order = await getOrderById(orderId);

    if (!order || order.customer_id !== userId) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: order }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
