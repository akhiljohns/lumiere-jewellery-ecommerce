import { NextRequest, NextResponse } from "next/server";
import { generateAllProductEmbeddings, upsertProductEmbedding } from "@/lib/embeddings";
import { requirePermission } from "@/lib/api-auth";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";
import { z } from "zod";

const singleEmbeddingSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  price: z.number().positive(),
  category_name: z.string().nullable().optional(),
});

/**
 * POST /api/admin/ai/embeddings
 * Generate embeddings for products.
 * Send empty body to batch-generate for all active products.
 * Send a product object to generate for a single product.
 */
export async function POST(request: NextRequest) {
  try {
    requirePermission(request, "product.create");
    const body = await request.json().catch(() => ({}));

    // If body has product_id, generate for single product
    if (body.product_id) {
      const parsed = singleEmbeddingSchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Validation failed",
          parsed.error.issues,
        );
      }

      await upsertProductEmbedding({
        id: parsed.data.product_id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        material: parsed.data.material ?? null,
        price: parsed.data.price,
        category_name: parsed.data.category_name ?? null,
      });

      return NextResponse.json(
        { data: { message: "Embedding generated successfully" } },
        { status: 200 },
      );
    }

    // Batch generate for all products
    const result = await generateAllProductEmbeddings();

    return NextResponse.json(
      {
        data: {
          message: `Batch embedding complete: ${result.processed} processed, ${result.errors} errors`,
          ...result,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
