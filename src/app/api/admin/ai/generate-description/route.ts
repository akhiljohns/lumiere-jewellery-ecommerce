import { NextRequest, NextResponse } from "next/server";
import { aiGenerateDescriptionSchema } from "@/lib/validators";
import { generateProductDescription } from "@/lib/ai";
import {
  requirePermission,
  ForbiddenError,
  forbiddenResponse,
} from "@/lib/api-auth";

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
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await generateProductDescription(parsed.data);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
