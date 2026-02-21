import { NextRequest, NextResponse } from "next/server";
import { productCreateSchema, productQuerySchema } from "@/lib/validators";
import {
  getProducts,
  createProduct,
} from "@/features/products/services/product-service";

/**
 * GET /api/admin/products
 * List products with pagination, search, filter, and sort.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    };

    const parsed = productQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await getProducts(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/products
 * Create a new product.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const product = await createProduct(parsed.data);

    return NextResponse.json(
      { data: product, message: "Product created successfully" },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
