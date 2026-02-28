import { NextRequest, NextResponse } from "next/server";
import { categoryUpdateSchema } from "@/lib/validators";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/features/categories/services/category-service";
import { logAdminAction, logAdminError, diffFields } from "@/lib/discord";
import {
  requirePermission,
  ForbiddenError,
  forbiddenResponse,
} from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/categories/[id]
 * Get a single category by ID.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(_request, "category.view");
    const { id } = await params;
    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: category }, { status: 200 });
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/categories/[id]
 * Update a category.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "category.edit");
    const { id } = await params;
    const body = await request.json();

    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Verify category exists
    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const category = await updateCategory(id, parsed.data);

    const changes = diffFields(
      parsed.data as Record<string, unknown>,
      existing as Record<string, unknown>,
    );

    logAdminAction("updated", "Category", existing.name, actor, [
      { name: "ID", value: id, inline: true },
      ...(changes.length > 0 ? changes : []),
      ...(changes.length === 0
        ? [{ name: "Changes", value: "no field changes detected" }]
        : []),
    ]);

    return NextResponse.json(
      { data: category, message: "Category updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    logAdminError("Update Category", message, actor);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const actor = _request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(_request, "category.delete");
    const { id } = await params;

    // Verify category exists
    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    await deleteCategory(id);

    logAdminAction("deleted", "Category", existing.name, actor, [
      { name: "ID", value: id, inline: true },
      { name: "Slug", value: existing.slug, inline: true },
    ]);

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    logAdminError("Delete Category", message, actor);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
