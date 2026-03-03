import { NextRequest, NextResponse } from "next/server";
import { orderStatusUpdateSchema } from "@/lib/validators";
import {
  getOrderById,
  updateOrderStatus,
} from "@/features/orders/services/order-service";
import { logAdminAction, logAdminError } from "@/lib/discord";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";
import { getClientIP } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(request, "order.view");
    const { id } = await params;

    const order = await getOrderById(id);
    if (!order) {
      throw new AppError(ErrorCode.NOT_FOUND, "Order not found");
    }

    return NextResponse.json({ data: order }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
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
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    const existing = await getOrderById(id);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "Order not found");
    }

    const order = await updateOrderStatus(id, parsed.data);

    logAdminAction("updated", "Order", existing.order_number, actor, [
      { name: "Status", value: `${existing.status} → ${parsed.data.status}`, inline: true },
      ...(parsed.data.cancelled_reason
        ? [{ name: "Reason", value: parsed.data.cancelled_reason, inline: false }]
        : []),
    ], { resource_id: id, actor_id: request.headers.get("x-user-id") ?? undefined, ip_address: getClientIP(request) });

    return NextResponse.json(
      { data: order, message: "Order status updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Update Order Status", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}
