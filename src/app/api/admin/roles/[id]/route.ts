import { NextRequest, NextResponse } from "next/server";
import {
  getRoleById,
  updateRole,
  deleteRole,
} from "@/features/roles/services/role-service";
import { getRoleRank, SUPER_ADMIN_ROLE } from "@/lib/permissions";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

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
      throw new AppError(ErrorCode.NOT_FOUND, "Role not found");
    }

    return NextResponse.json({ data: role }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
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
      throw new AppError(ErrorCode.NOT_FOUND, "Role not found");
    }

    // super_admin is permanently locked — no one can change its permissions
    if (existing.name === SUPER_ADMIN_ROLE) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "The super_admin role is locked and cannot be modified",
      );
    }

    // Hierarchy: requester must outrank the role being edited
    const requesterRole = request.headers.get("x-user-role") ?? "";
    if (requesterRole !== SUPER_ADMIN_ROLE) {
      if (getRoleRank(requesterRole) <= getRoleRank(existing.name)) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "You cannot edit a role with equal or higher rank than your own",
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
    return errorResponse(err);
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
      throw new AppError(ErrorCode.NOT_FOUND, "Role not found");
    }

    if (existing.is_system) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        "System roles cannot be deleted",
      );
    }

    await deleteRole(id);

    return NextResponse.json(
      { message: "Role deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
