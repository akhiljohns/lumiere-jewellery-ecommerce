import { NextRequest, NextResponse } from "next/server";
import { aiSuggestCategorySchema } from "@/lib/validators";
import { suggestCategory } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * POST /api/admin/ai/suggest-category
 * Suggest category, material, and tags for a product name using AI.
 * Requires product.create permission.
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.create");
    const body = await request.json();

    const parsed = aiSuggestCategorySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    // Fetch existing category names to ground suggestions
    const supabase = createAdminClient();
    const { data: categories } = await supabase
      .from("categories")
      .select("name")
      .eq("is_active", true)
      .order("name");

    const categoryNames = (categories ?? []).map((c) => c.name);

    const result = await suggestCategory({
      ...parsed.data,
      categories: categoryNames,
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
