import { NextRequest, NextResponse } from "next/server";
import { productCreateSchema, productQuerySchema } from "@/lib/validators";
import {
  getProducts,
  createProduct,
} from "@/features/products/services/product-service";
import { logAdminAction, logAdminError } from "@/lib/discord";
import { requirePermission } from "@/lib/api-auth";
import { revalidateProductCache } from "@/lib/cache";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";
import { getClientIP } from "@/lib/rate-limit";

/**
 * GET /api/admin/products
 * List products with pagination, search, filter, and sort.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "product.view");
    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
      category_id: searchParams.get("category_id") ?? undefined,
    };

    const parsed = productQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid query parameters",
        parsed.error.issues,
      );
    }

    const result = await getProducts(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/products
 * Create a new product.
 */
export async function POST(request: NextRequest) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "product.create");
    const body = await request.json();

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    const product = await createProduct(parsed.data);

    revalidateProductCache();

    logAdminAction("created", "Product", parsed.data.name, actor, [
      { name: "ID", value: product.id, inline: true },
      { name: "Category", value: product.categories?.name ?? "none", inline: true },
      { name: "Price", value: `₹${parsed.data.price}`, inline: true },
      { name: "Stock", value: String(parsed.data.stock ?? 0), inline: true },
      { name: "Active", value: parsed.data.is_active !== false ? "Yes" : "No", inline: true },
    ], { resource_id: product.id, actor_id: request.headers.get("x-user-id") ?? undefined, ip_address: getClientIP(request) });

    return NextResponse.json(
      { data: product, message: "Product created successfully" },
      { status: 201 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Create Product", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}
