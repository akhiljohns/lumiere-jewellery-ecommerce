import { NextRequest, NextResponse } from "next/server";
import { userUpdateSchema } from "@/lib/validators";
import {
  getUserById,
  updateUser,
  deleteUser,
} from "@/features/users/services/user-service";
import { logAdminAction, logAdminError, diffFields } from "@/lib/discord";
import { requirePermission, ForbiddenError, forbiddenResponse } from "@/lib/api-auth";

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Verify user exists
    const existing = await getUserById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    logAdminError("Update User", message, actor);
    return NextResponse.json({ error: message }, { status: 500 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-delete
    const currentUserId = request.headers.get("x-user-id");
    if (currentUserId === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
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
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    logAdminError("Delete User", message, actor);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
