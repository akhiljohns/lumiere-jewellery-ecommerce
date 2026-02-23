import { NextRequest, NextResponse } from "next/server";
import {
  getRoleById,
  updateRole,
  deleteRole,
} from "@/features/roles/services/role-service";
import { getRoleRank, SUPER_ADMIN_ROLE } from "@/lib/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/roles/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const role = await getRoleById(id);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ data: role }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/roles/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getRoleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // super_admin is permanently locked — no one can change its permissions
    if (existing.name === SUPER_ADMIN_ROLE) {
      return NextResponse.json(
        { error: "The super_admin role is locked and cannot be modified" },
        { status: 403 },
      );
    }

    // Hierarchy: requester must outrank the role being edited
    const requesterRole = request.headers.get("x-user-role") ?? "";
    if (requesterRole !== SUPER_ADMIN_ROLE) {
      if (getRoleRank(requesterRole) <= getRoleRank(existing.name)) {
        return NextResponse.json(
          { error: "You cannot edit a role with equal or higher rank than your own" },
          { status: 403 },
        );
      }
    }

    const role = await updateRole(id, {
      name: existing.is_system ? undefined : body.name,
      description: body.description,
      permissions: Array.isArray(body.permissions) ? body.permissions : undefined,
    });

    return NextResponse.json(
      { data: role, message: "Role updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/roles/[id]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await getRoleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existing.is_system) {
      return NextResponse.json(
        { error: "System roles cannot be deleted" },
        { status: 400 },
      );
    }

    await deleteRole(id);

    return NextResponse.json(
      { message: "Role deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
