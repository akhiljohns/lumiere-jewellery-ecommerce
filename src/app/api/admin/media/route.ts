import { NextRequest, NextResponse } from "next/server";
import { listMedia, createMediaRecord } from "@/features/media/services/media-service";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

/**
 * GET /api/admin/media
 * List media with pagination and search.
 */
export async function GET(request: NextRequest) {
  try {
    requirePermission(request, "product.view");
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 24);
    const search = searchParams.get("search") ?? undefined;

    const result = await listMedia({ page, limit, search });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/media
 * Upload a new image and create a media record.
 * Body: { file: string, filename?: string, alt_text?: string }
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.create");
    const body = await request.json();

    if (!body.file || typeof body.file !== "string") {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Missing or invalid 'file' field. Provide a base64 data URI or URL.",
      );
    }

    const userId = request.headers.get("x-user-id") ?? undefined;

    const media = await createMediaRecord({
      file: body.file,
      filename: body.filename,
      alt_text: body.alt_text,
      uploaded_by: userId,
    });

    return NextResponse.json(
      { data: media, message: "Media uploaded successfully" },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
