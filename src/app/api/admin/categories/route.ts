import { NextRequest, NextResponse } from "next/server";
import { categoryCreateSchema, categoryQuerySchema } from "@/lib/validators";
import {
  getCategories,
  createCategory,
} from "@/features/categories/services/category-service";
import { logAdminAction, logAdminError } from "@/lib/discord";
import {
  requirePermission,
  ForbiddenError,
  forbiddenResponse,
} from "@/lib/api-auth";
import { revalidateCategoryCache } from "@/lib/cache";

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
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await getCategories(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
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
    ]);

    return NextResponse.json(
      { data: category, message: "Category created successfully" },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ForbiddenError) return forbiddenResponse(err.message);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    logAdminError("Create Category", message, actor);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
