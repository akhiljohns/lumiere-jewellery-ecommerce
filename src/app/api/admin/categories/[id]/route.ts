import { NextRequest, NextResponse } from "next/server";
import { categoryUpdateSchema } from "@/lib/validators";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/features/categories/services/category-service";
import { logAdminAction, logAdminError, diffFields } from "@/lib/discord";
import { requirePermission } from "@/lib/api-auth";
import { revalidateCategoryCache } from "@/lib/cache";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";
import { getClientIP } from "@/lib/rate-limit";

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
      throw new AppError(ErrorCode.NOT_FOUND, "Category not found");
    }

    return NextResponse.json({ data: category }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
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
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    // Verify category exists
    const existing = await getCategoryById(id);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "Category not found");
    }

    const category = await updateCategory(id, parsed.data);
    revalidateCategoryCache();

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
    ], { resource_id: id, actor_id: request.headers.get("x-user-id") ?? undefined, ip_address: getClientIP(request) });

    return NextResponse.json(
      { data: category, message: "Category updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Update Category", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
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
      throw new AppError(ErrorCode.NOT_FOUND, "Category not found");
    }

    await deleteCategory(id);
    revalidateCategoryCache();

    logAdminAction("deleted", "Category", existing.name, actor, [
      { name: "ID", value: id, inline: true },
      { name: "Slug", value: existing.slug, inline: true },
    ], { resource_id: id, actor_id: _request.headers.get("x-user-id") ?? undefined, ip_address: getClientIP(_request) });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Delete Category", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}
