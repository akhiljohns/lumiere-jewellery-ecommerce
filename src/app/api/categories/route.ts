import { NextResponse } from "next/server";
import { getPublicCategories } from "@/features/storefront/services/storefront-service";

/**
 * GET /api/categories
 * Public category list with product counts.
 * No authentication required.
 */
export async function GET() {
  try {
    const categories = await getPublicCategories();

    return NextResponse.json({ data: categories }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
