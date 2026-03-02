import { NextRequest, NextResponse } from "next/server";
import { aiAutoTagSchema } from "@/lib/validators";
import { autoTagProduct } from "@/lib/ai";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

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
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    const result = await autoTagProduct(parsed.data);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
