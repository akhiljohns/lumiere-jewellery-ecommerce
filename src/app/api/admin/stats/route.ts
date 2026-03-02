import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/features/dashboard/services/stats-service";
import { requirePermission, ForbiddenError, forbiddenResponse } from "@/lib/api-auth";

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
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
