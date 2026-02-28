import { NextRequest, NextResponse } from "next/server";
import { orderQuerySchema } from "@/lib/validators";
import { getCustomerOrders } from "@/features/orders/services/order-service";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = orderQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await getCustomerOrders(userId, query);

    return NextResponse.json(
      { data: result.data, pagination: result.pagination },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
