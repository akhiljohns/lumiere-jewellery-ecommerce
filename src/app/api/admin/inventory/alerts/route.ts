import { NextRequest, NextResponse } from "next/server";
import { getInventoryAlerts, sendLowStockDiscordAlert } from "@/features/dashboard/services/inventory-alerts-service";
import { requirePermission } from "@/lib/api-auth";
import { errorResponse } from "@/lib/errors";

/**
 * GET /api/admin/inventory/alerts
 * Get inventory alerts including low stock, out of stock,
 * sales velocity, and restock recommendations.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "product.view");

    const alerts = await getInventoryAlerts();

    return NextResponse.json({ data: alerts }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/inventory/alerts
 * Trigger a Discord notification for low stock alerts.
 * Useful as a cron job target.
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.view");

    await sendLowStockDiscordAlert();

    return NextResponse.json(
      { data: { message: "Low stock alert sent to Discord" } },
      { status: 200 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
