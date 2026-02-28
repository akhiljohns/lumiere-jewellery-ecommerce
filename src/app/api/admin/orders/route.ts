import { NextRequest, NextResponse } from "next/server";
import { orderQuerySchema } from "@/lib/validators";
import { getAllOrders } from "@/features/orders/services/order-service";
import { requirePermission, ForbiddenError, forbiddenResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "order.view");

    const { searchParams } = new URL(request.url);
    const query = orderQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await getAllOrders(query);

    return NextResponse.json(
      { data: result.data, pagination: result.pagination },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
