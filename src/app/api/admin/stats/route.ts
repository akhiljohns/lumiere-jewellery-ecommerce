import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/features/dashboard/services/stats-service";
import { requirePermission } from "@/lib/api-auth";
import { errorResponse } from "@/lib/errors";

/**
 * GET /api/admin/stats
 * Returns aggregate dashboard statistics.
 * Requires: dashboard.view permission.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "dashboard.view");

    const stats = await getDashboardStats();

    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
