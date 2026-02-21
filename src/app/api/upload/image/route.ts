import { NextRequest, NextResponse } from "next/server";
import {
  uploadProductImage,
  deleteProductImage,
} from "@/features/products/services/image-service";

/**
 * POST /api/upload/image
 * Upload an image to Cloudinary.
 * Body: { file: string } (base64 data URI or URL)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.file || typeof body.file !== "string") {
      return NextResponse.json(
        {
          error:
            "Missing or invalid 'file' field. Provide a base64 data URI or URL.",
        },
        { status: 400 },
      );
    }

    const result = await uploadProductImage(body.file);

    return NextResponse.json(
      { data: result, message: "Image uploaded successfully" },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/upload/image
 * Delete an image from Cloudinary.
 * Body: { public_id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.public_id || typeof body.public_id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'public_id' field." },
        { status: 400 },
      );
    }

    await deleteProductImage(body.public_id);

    return NextResponse.json(
      { message: "Image deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
