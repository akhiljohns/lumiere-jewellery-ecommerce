import { NextRequest, NextResponse } from "next/server";
import { orderStatusUpdateSchema } from "@/lib/validators";
import {
  getOrderById,
  updateOrderStatus,
} from "@/features/orders/services/order-service";
import { logAdminAction, logAdminError } from "@/lib/discord";
import { requirePermission, ForbiddenError, forbiddenResponse } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(request, "order.view");
    const { id } = await params;

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: order }, { status: 200 });
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "order.edit");
    const { id } = await params;
    const body = await request.json();

    const parsed = orderStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    const order = await updateOrderStatus(id, parsed.data);

    logAdminAction("updated", "Order", existing.order_number, actor, [
      { name: "Status", value: `${existing.status} → ${parsed.data.status}`, inline: true },
      ...(parsed.data.cancelled_reason
        ? [{ name: "Reason", value: parsed.data.cancelled_reason, inline: false }]
        : []),
    ], { resource_id: id, actor_id: request.headers.get("x-user-id") ?? undefined });

    return NextResponse.json(
      { data: order, message: "Order status updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    const status =
      message === "Order not found"
        ? 404
        : message.includes("Cannot transition")
          ? 400
          : 500;

    if (status === 500) logAdminError("Update Order Status", message, actor);
    return NextResponse.json({ error: message }, { status });
  }
}
