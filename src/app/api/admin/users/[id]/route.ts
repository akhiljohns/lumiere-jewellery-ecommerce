import { NextRequest, NextResponse } from "next/server";
import { userUpdateSchema } from "@/lib/validators";
import {
  getUserById,
  updateUser,
  deleteUser,
} from "@/features/users/services/user-service";
import { logAdminAction, logAdminError, diffFields } from "@/lib/discord";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/[id]
 * Get a single user by ID.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(_request, "user.view");
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, "User not found");
    }

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update a user.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "user.edit");
    const { id } = await params;
    const body = await request.json();

    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    // Verify user exists
    const existing = await getUserById(id);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "User not found");
    }

    const user = await updateUser(id, parsed.data);

    const changes = diffFields(
      parsed.data as Record<string, unknown>,
      existing as Record<string, unknown>,
      ["password"],
    );

    const hasPasswordChange = "password" in parsed.data && parsed.data.password;

    logAdminAction("updated", "User", existing.email, actor, [
      { name: "ID", value: id, inline: true },
      ...(changes.length > 0 ? changes : []),
      ...(hasPasswordChange ? [{ name: "password", value: "changed", inline: true }] : []),
      ...(changes.length === 0 && !hasPasswordChange
        ? [{ name: "Changes", value: "no field changes detected" }]
        : []),
    ], { resource_id: id, actor_id: request.headers.get("x-user-id") ?? undefined });

    return NextResponse.json(
      { data: user, message: "User updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Update User", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "user.delete");
    const { id } = await params;

    // Verify user exists
    const existing = await getUserById(id);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "User not found");
    }

    // Prevent self-delete
    const currentUserId = request.headers.get("x-user-id");
    if (currentUserId === id) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        "You cannot delete your own account",
      );
    }

    await deleteUser(id);

    logAdminAction("deleted", "User", existing.email, actor, [
      { name: "ID", value: id, inline: true },
      { name: "Name", value: existing.full_name ?? "—", inline: true },
      { name: "Role", value: existing.role, inline: true },
    ], { resource_id: id, actor_id: request.headers.get("x-user-id") ?? undefined });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Delete User", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}
