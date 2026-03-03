import { NextRequest, NextResponse } from "next/server";
import { categoryCreateSchema, categoryQuerySchema } from "@/lib/validators";
import {
  getCategories,
  createCategory,
} from "@/features/categories/services/category-service";
import { logAdminAction, logAdminError } from "@/lib/discord";
import { requirePermission } from "@/lib/api-auth";
import { revalidateCategoryCache } from "@/lib/cache";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";
import { getClientIP } from "@/lib/rate-limit";

/**
 * GET /api/admin/categories
 * List categories with pagination, search, filter, and sort.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "category.view");
    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
      parent_id: searchParams.get("parent_id") ?? undefined,
      active_only: searchParams.get("active_only") ?? undefined,
    };

    const parsed = categoryQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid query parameters",
        parsed.error.issues,
      );
    }

    const result = await getCategories(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/categories
 * Create a new category.
 */
export async function POST(request: NextRequest) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "category.create");
    const body = await request.json();

    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    const category = await createCategory(parsed.data);
    revalidateCategoryCache();

    logAdminAction("created", "Category", parsed.data.name, actor, [
      { name: "ID", value: category.id, inline: true },
      { name: "Slug", value: category.slug, inline: true },
      {
        name: "Parent",
        value: parsed.data.parent_id ?? "none",
        inline: true,
      },
      {
        name: "Active",
        value: parsed.data.is_active !== false ? "Yes" : "No",
        inline: true,
      },
    ], { resource_id: category.id, actor_id: request.headers.get("x-user-id") ?? undefined, ip_address: getClientIP(request) });

    return NextResponse.json(
      { data: category, message: "Category created successfully" },
      { status: 201 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Create Category", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}
