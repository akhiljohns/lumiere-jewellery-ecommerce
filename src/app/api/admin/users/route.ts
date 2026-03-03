import { NextRequest, NextResponse } from "next/server";
import { userCreateSchema, paginationSchema } from "@/lib/validators";
import { getUsers, createUser } from "@/features/users/services/user-service";
import { logAdminAction, logAdminError } from "@/lib/discord";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";
import { getClientIP } from "@/lib/rate-limit";

/**
 * GET /api/admin/users
 * List users with pagination and search.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "user.view");
    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    };

    const parsed = paginationSchema.safeParse(queryInput);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid query parameters",
        parsed.error.issues,
      );
    }

    const verified = searchParams.get("verified");
    const emailVerified =
      verified === "true" ? true : verified === "false" ? false : undefined;

    const result = await getUsers(parsed.data, { emailVerified });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/users
 * Create a new user.
 */
export async function POST(request: NextRequest) {
  const actor = request.headers.get("x-user-email") ?? "unknown";

  try {
    requirePermission(request, "user.create");
    const body = await request.json();

    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    const user = await createUser(parsed.data);

    logAdminAction("created", "User", parsed.data.email, actor, [
      { name: "ID", value: user.id, inline: true },
      { name: "Name", value: parsed.data.full_name ?? "—", inline: true },
      { name: "Role", value: parsed.data.role ?? "customer", inline: true },
      { name: "Active", value: parsed.data.is_active !== false ? "Yes" : "No", inline: true },
    ], { resource_id: user.id, actor_id: request.headers.get("x-user-id") ?? undefined, ip_address: getClientIP(request) });

    return NextResponse.json(
      { data: user, message: "User created successfully" },
      { status: 201 },
    );
  } catch (err) {
    if (!(err instanceof AppError)) logAdminError("Create User", err instanceof Error ? err.message : "Unknown error", actor);
    return errorResponse(err);
  }
}
