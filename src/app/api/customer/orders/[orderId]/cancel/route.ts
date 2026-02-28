import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/features/orders/services/order-service";
import { logToDiscord } from "@/lib/discord";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get("x-user-id");
    const userEmail = request.headers.get("x-user-email");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { orderId } = await params;

    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body provided, that's fine
    }

    const order = await cancelOrder(orderId, userId, reason);

    // Discord notification
    logToDiscord({
      title: "Order Cancelled",
      description: `**${order.order_number}**`,
      fields: [
        { name: "Reason", value: reason ?? "Cancelled by customer", inline: false },
        { name: "Customer", value: userEmail ?? userId, inline: true },
      ],
      level: "warning",
    });

    return NextResponse.json(
      { data: order, message: "Order cancelled successfully" },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status =
      message === "Order not found"
        ? 404
        : message === "Order cannot be cancelled at this stage"
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
