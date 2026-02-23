import { NextRequest, NextResponse } from "next/server";
import { productUpdateSchema } from "@/lib/validators";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/features/products/services/product-service";
import { logAdminAction, logAdminError, diffFields } from "@/lib/discord";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/products/[id]
 * Get a single product by ID.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Update a product.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Verify product exists
    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await updateProduct(id, parsed.data);

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
    ]);

    return NextResponse.json(
      { data: product, message: "Product updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    logAdminError("Update Product", message, actor);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete a product.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const actor = _request.headers.get("x-user-email") ?? "unknown";

  try {
    const { id } = await params;

    // Verify product exists
    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await deleteProduct(id);

    logAdminAction("deleted", "Product", existing.name, actor, [
      { name: "ID", value: id, inline: true },
      { name: "Category", value: existing.category, inline: true },
      { name: "Price", value: `₹${existing.price}`, inline: true },
    ]);

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    logAdminError("Delete Product", message, actor);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
