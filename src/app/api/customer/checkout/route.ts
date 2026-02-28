import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validators";
import { createOrderFromCart } from "@/features/orders/services/order-service";
import { logToDiscord } from "@/lib/discord";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getOrderById } from "@/features/orders/services/order-service";
import { formatCurrency } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userEmail = request.headers.get("x-user-email");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await createOrderFromCart(userId, parsed.data);

    // Send order confirmation email for COD orders immediately
    if (parsed.data.payment_method === "cod") {
      const order = await getOrderById(result.order_id);
      if (order && userEmail) {
        const addr = order.shipping_address;
        sendOrderConfirmationEmail(userEmail, addr.full_name, {
          order_number: order.order_number,
          items: order.order_items.map((item) => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
          subtotal: order.subtotal,
          shipping_fee: order.shipping_fee,
          total: order.total,
          payment_method: order.payment_method,
          shipping_address: addr,
        }).catch(() => {});
      }
    }

    // Discord notification
    logToDiscord({
      title: "New Order Placed",
      description: `**${result.order_number}**`,
      fields: [
        { name: "Total", value: formatCurrency(result.total), inline: true },
        {
          name: "Payment",
          value: result.payment_method === "cod" ? "Cash on Delivery" : "Razorpay",
          inline: true,
        },
        { name: "Customer", value: userEmail ?? userId, inline: true },
      ],
      level: "success",
    });

    return NextResponse.json(
      { data: result, message: "Order placed successfully" },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status =
      message === "Cart not found" || message === "Address not found"
        ? 404
        : message === "Cart is empty"
          ? 400
          : message.includes("Insufficient stock") ||
              message.includes("not available")
            ? 409
            : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
