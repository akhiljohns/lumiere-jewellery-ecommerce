import { NextRequest, NextResponse } from "next/server";
import { getPricingSuggestions } from "@/features/dashboard/services/pricing-suggestions-service";
import { requirePermission } from "@/lib/api-auth";
import { errorResponse } from "@/lib/errors";

/**
 * GET /api/admin/pricing/suggestions
 * Get pricing suggestions and margin analysis for all products.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "product.view");

    const suggestions = await getPricingSuggestions();

    return NextResponse.json({ data: suggestions }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
