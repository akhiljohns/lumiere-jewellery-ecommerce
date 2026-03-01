import { NextRequest, NextResponse } from "next/server";
import { adminSearchQuerySchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * GET /api/admin/search
 * Unified search across products, users, and orders.
 * Requires dashboard.view permission.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "dashboard.view");
    const { searchParams } = new URL(request.url);
    const queryInput = {
      query: searchParams.get("query") ?? searchParams.get("q") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const parsed = adminSearchQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid query parameters",
        parsed.error.issues,
      );
    }

    const { query, type, limit } = parsed.data;
    const supabase = createAdminClient();

    if (type === "products") {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, stock, is_active, product_images(url, is_primary)")
        .textSearch("search_vector", query, {
          type: "websearch",
          config: "english",
        })
        .limit(limit);

      if (error) throw new Error(error.message);
      return NextResponse.json({ data, type }, { status: 200 });
    }

    if (type === "users") {
      const searchPattern = `%${query}%`;
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, phone, role, is_active")
        .or(`email.ilike.${searchPattern},full_name.ilike.${searchPattern},phone.ilike.${searchPattern}`)
        .limit(limit);

      if (error) throw new Error(error.message);
      return NextResponse.json({ data, type }, { status: 200 });
    }

    if (type === "orders") {
      const searchPattern = `%${query}%`;
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, total, created_at, users(email, full_name)")
        .or(`order_number.ilike.${searchPattern}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return NextResponse.json({ data, type }, { status: 200 });
    }

    throw new AppError(ErrorCode.BAD_REQUEST, "Invalid search type");
  } catch (err) {
    return errorResponse(err);
  }
}
