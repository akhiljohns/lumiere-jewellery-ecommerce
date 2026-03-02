import { NextRequest, NextResponse } from "next/server";
import { getRoles, createRole } from "@/features/roles/services/role-service";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * GET /api/admin/roles
 * List all roles with their permissions.
 * Accessible to all authenticated admins.
 */
export async function GET(_request: NextRequest) {
  try {
    const result = await getRoles();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/roles
 * Create a new role with permissions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Role name is required");
    }

    const role = await createRole({
      name: body.name.trim(),
      description: body.description ?? null,
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
    });

    return NextResponse.json(
      { data: role, message: "Role created successfully" },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
