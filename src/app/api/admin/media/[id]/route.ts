import { NextRequest, NextResponse } from "next/server";
import {
  getMediaById,
  updateMedia,
  deleteMedia,
} from "@/features/media/services/media-service";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/media/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(request, "product.view");
    const { id } = await params;

    const media = await getMediaById(id);
    if (!media) {
      throw new AppError(ErrorCode.NOT_FOUND, "Media not found");
    }

    return NextResponse.json({ data: media }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PATCH /api/admin/media/[id]
 * Update media metadata (filename, alt_text).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(request, "product.edit");
    const { id } = await params;
    const body = await request.json();

    const media = await updateMedia(id, {
      filename: body.filename,
      alt_text: body.alt_text,
    });

    return NextResponse.json(
      { data: media, message: "Media updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * DELETE /api/admin/media/[id]
 * Delete media from Cloudinary and database.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    requirePermission(request, "product.delete");
    const { id } = await params;

    await deleteMedia(id);

    return NextResponse.json(
      { message: "Media deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
