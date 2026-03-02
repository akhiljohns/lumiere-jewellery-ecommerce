import { NextRequest, NextResponse } from "next/server";
import { getRoles, createRole } from "@/features/roles/services/role-service";

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
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
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
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
