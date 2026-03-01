import { NextRequest, NextResponse } from "next/server";
import { orderQuerySchema } from "@/lib/validators";
import { getAllOrders } from "@/features/orders/services/order-service";
import { requirePermission } from "@/lib/api-auth";
import { errorResponse } from "@/lib/errors";

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
    return errorResponse(err);
  }
}
