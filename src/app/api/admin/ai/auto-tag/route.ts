import { NextRequest, NextResponse } from "next/server";
import { aiAutoTagSchema } from "@/lib/validators";
import { autoTagProduct } from "@/lib/ai";
import {
  requirePermission,
  ForbiddenError,
  forbiddenResponse,
} from "@/lib/api-auth";

/**
 * POST /api/admin/ai/auto-tag
 * Generate occasion, style, and gifting tags for a product using AI.
 * Requires product.create permission.
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.create");
    const body = await request.json();

    const parsed = aiAutoTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await autoTagProduct(parsed.data);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
