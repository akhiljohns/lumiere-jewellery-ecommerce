import { NextRequest, NextResponse } from "next/server";
import { productUpdateSchema } from "@/lib/validators";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/features/products/services/product-service";
import { logAdminAction, logAdminError, diffFields } from "@/lib/discord";
import { requirePermission } from "@/lib/api-auth";
import { revalidateProductCache } from "@/lib/cache";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/products/[id]
 * Get a single product by ID.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(_request, "product.view");
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      throw new AppError(ErrorCode.NOT_FOUND, "Product not found");
    }

    return NextResponse.json({ data: product }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Update a product.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "product.edit");
    const { id } = await params;
    const body = await request.json();

    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    // Verify product exists
    const existing = await getProductById(id);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "Product not found");
    }

    const product = await updateProduct(id, parsed.data);
    revalidateProductCache();

    const changes = diffFields(
      parsed.data as Record<string, unknown>,
      existing as Record<string, unknown>,
      ["images"],
    );

    const hasImageChanges = "images" in parsed.data;

    logAdminAction("updated", "Product", existing.name, actor, [
      { name: "ID", value: id, inline: true },
      ...(changes.length > 0 ? changes : []),
      ...(hasImageChanges ? [{ name: "images", value: "updated", inline: true }] : []),
      ...(changes.length === 0 && !hasImageChanges
        ? [{ name: "Changes", value: "no field changes detected" }]
        : []),
    ], { resource_id: id, actor_id: request.headers.get("x-user-id") ?? undefined });

    return NextResponse.json(
      { data: product, message: "Product updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Update Product", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete a product.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const actor = _request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(_request, "product.delete");
    const { id } = await params;

    // Verify product exists
    const existing = await getProductById(id);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "Product not found");
    }

    await deleteProduct(id);
    revalidateProductCache();

    logAdminAction("deleted", "Product", existing.name, actor, [
      { name: "ID", value: id, inline: true },
      { name: "Category", value: existing.categories?.name ?? "none", inline: true },
      { name: "Price", value: `₹${existing.price}`, inline: true },
    ], { resource_id: id, actor_id: _request.headers.get("x-user-id") ?? undefined });

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Delete Product", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}
