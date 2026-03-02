import { NextRequest, NextResponse } from "next/server";
import { aiGenerateDescriptionSchema } from "@/lib/validators";
import { generateProductDescription } from "@/lib/ai";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * POST /api/admin/ai/generate-description
 * Generate product description, SEO meta, and tags using AI.
 * Requires product.create permission.
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.create");
    const body = await request.json();

    const parsed = aiGenerateDescriptionSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    const result = await generateProductDescription(parsed.data);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
