import { NextRequest, NextResponse } from "next/server";
import { userCreateSchema, paginationSchema } from "@/lib/validators";
import { getUsers, createUser } from "@/features/users/services/user-service";

/**
 * GET /api/admin/users
 * List users with pagination and search.
 */
export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await getUsers(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const user = await createUser(parsed.data);

    return NextResponse.json(
      { data: user, message: "User created successfully" },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
