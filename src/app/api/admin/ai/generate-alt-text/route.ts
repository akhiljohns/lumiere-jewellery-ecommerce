import { NextRequest, NextResponse } from "next/server";
import { aiGenerateAltTextSchema } from "@/lib/validators";
import { generateImageAltText } from "@/lib/ai";
import {
  requirePermission,
  ForbiddenError,
  forbiddenResponse,
} from "@/lib/api-auth";

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
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const altText = await generateImageAltText(parsed.data.image_url);

    return NextResponse.json({ data: { alt_text: altText } }, { status: 200 });
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
