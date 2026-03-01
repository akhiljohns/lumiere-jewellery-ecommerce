import { NextRequest, NextResponse } from "next/server";
import { SUPER_ADMIN_ROLE } from "@/lib/permissions";
import { AppError, ErrorCode } from "@/lib/errors";

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(ErrorCode.FORBIDDEN, message);
    this.name = "ForbiddenError";
  }
}

/**
 * Checks that the request has the required permission.
 * Throws ForbiddenError if not authorized.
 * super_admin bypasses all checks.
 */
export function requirePermission(
  request: NextRequest,
  permission: string,
): void {
  const role = request.headers.get("x-user-role");
  if (role === SUPER_ADMIN_ROLE) return;

  const permsHeader = request.headers.get("x-user-permissions");
  const perms: string[] = permsHeader ? JSON.parse(permsHeader) : [];

  if (!perms.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export function forbiddenResponse(message = "Insufficient permissions") {
  return NextResponse.json(
    { error: message, code: ErrorCode.FORBIDDEN },
    { status: 403 },
  );
}
