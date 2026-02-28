import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { logToDiscord } from "@/lib/discord";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 },
      );
    }

    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 },
      );
    }

    const event = JSON.parse(body);
    const eventType: string = event.event;
    const payload = event.payload;

    const supabase = createAdminClient();

    switch (eventType) {
      case "payment.captured": {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const razorpayOrderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;

        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number, payment_status")
          .eq("razorpay_order_id", razorpayOrderId)
          .single();

        if (order && order.payment_status !== "paid") {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed",
              razorpay_payment_id: paymentId,
            })
            .eq("id", order.id);

          logToDiscord({
            title: "Payment Captured (Webhook)",
            description: `**${order.order_number}**`,
            fields: [
              { name: "Payment ID", value: paymentId, inline: true },
              {
                name: "Amount",
                value: `₹${(paymentEntity.amount / 100).toFixed(2)}`,
                inline: true,
              },
            ],
            level: "success",
          });
        }
        break;
      }

      case "payment.failed": {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const razorpayOrderId = paymentEntity.order_id;

        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number")
          .eq("razorpay_order_id", razorpayOrderId)
          .single();

        if (order) {
          await supabase
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", order.id);

          logToDiscord({
            title: "Payment Failed (Webhook)",
            description: `**${order.order_number}**`,
            fields: [
              {
                name: "Error",
                value: paymentEntity.error_description ?? "Unknown error",
                inline: false,
              },
            ],
            level: "error",
          });
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) break;

        const paymentId = refundEntity.payment_id;

        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number")
          .eq("razorpay_payment_id", paymentId)
          .single();

        if (order) {
          await supabase
            .from("orders")
            .update({ payment_status: "refunded", status: "refunded" })
            .eq("id", order.id);

          logToDiscord({
            title: "Refund Processed (Webhook)",
            description: `**${order.order_number}**`,
            fields: [
              {
                name: "Refund Amount",
                value: `₹${(refundEntity.amount / 100).toFixed(2)}`,
                inline: true,
              },
            ],
            level: "warning",
          });
        }
        break;
      }
    }

    // Always return 200 to acknowledge
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[razorpay-webhook]", error);
    // Still return 200 to prevent Razorpay retries on processing errors
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
