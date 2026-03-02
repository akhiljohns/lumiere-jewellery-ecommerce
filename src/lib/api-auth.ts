import { NextRequest, NextResponse } from "next/server";
import { SUPER_ADMIN_ROLE } from "@/lib/permissions";

export class ForbiddenError extends Error {
  constructor(message = "Insufficient permissions") {
    super(message);
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
  return NextResponse.json({ error: message }, { status: 403 });
}
