import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSchema } from "@/lib/validators";
import { verifyPayment } from "@/features/orders/services/order-service";
import { logToDiscord } from "@/lib/discord";
import { sendOrderConfirmationEmail } from "@/lib/email";
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

    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const order = await verifyPayment(
      parsed.data.razorpay_order_id,
      parsed.data.razorpay_payment_id,
      parsed.data.razorpay_signature,
    );

    // Send confirmation email
    if (userEmail) {
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

    // Discord notification
    logToDiscord({
      title: "Payment Verified",
      description: `**${order.order_number}**`,
      fields: [
        { name: "Total", value: formatCurrency(order.total), inline: true },
        {
          name: "Payment ID",
          value: parsed.data.razorpay_payment_id,
          inline: true,
        },
        { name: "Customer", value: userEmail ?? userId, inline: true },
      ],
      level: "success",
    });

    return NextResponse.json(
      { data: order, message: "Payment verified successfully" },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status =
      message === "Invalid payment signature"
        ? 400
        : message === "Order not found"
          ? 404
          : message === "Payment already verified"
            ? 409
            : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
