import { NextRequest, NextResponse } from "next/server";
import { aiAnalyzeImageSchema } from "@/lib/validators";
import { analyzeImage } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * POST /api/admin/ai/analyze-image
 * Analyze a jewellery image using AI vision to extract structured attributes.
 * Requires product.create permission.
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.create");
    const body = await request.json();

    const parsed = aiAnalyzeImageSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    // Fetch existing category names so AI picks from real categories
    const supabase = createAdminClient();
    const { data: cats } = await supabase
      .from("categories")
      .select("name")
      .eq("is_active", true)
      .order("name");
    const categoryNames = (cats ?? []).map((c) => c.name);

    const analysis = await analyzeImage(
      parsed.data.image_url,
      parsed.data.additional_image_urls,
      categoryNames,
    );

    return NextResponse.json({ data: analysis }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
