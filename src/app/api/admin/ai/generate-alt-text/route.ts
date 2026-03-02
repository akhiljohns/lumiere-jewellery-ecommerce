import { NextRequest, NextResponse } from "next/server";
import { aiGenerateAltTextSchema } from "@/lib/validators";
import { generateImageAltText } from "@/lib/ai";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * POST /api/admin/ai/generate-alt-text
 * Generate alt text for a product image using AI vision.
 * Requires product.create permission.
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.create");
    const body = await request.json();

    const parsed = aiGenerateAltTextSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    const altText = await generateImageAltText(parsed.data.image_url);

    return NextResponse.json({ data: { alt_text: altText } }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
