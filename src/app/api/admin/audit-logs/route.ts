import { NextRequest, NextResponse } from "next/server";
import { auditLogQuerySchema } from "@/lib/validators";
import { getAuditLogs } from "@/features/audit/services/audit-service";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * GET /api/admin/audit-logs
 * List audit logs with pagination, filters (actor, resource, action, date range).
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "audit.view");
    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
      actor_email: searchParams.get("actor_email") ?? undefined,
      resource: searchParams.get("resource") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      resource_id: searchParams.get("resource_id") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
    };

    const parsed = auditLogQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid query parameters",
        parsed.error.issues,
      );
    }

    const result = await getAuditLogs(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
