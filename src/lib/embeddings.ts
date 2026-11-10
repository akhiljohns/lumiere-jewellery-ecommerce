import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Lazy-initialized client ────────────────────────

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

// ── Generate Embedding ─────────────────────────────

// text-embedding-004 was shut down on 14 Jan 2026. gemini-embedding-2 truncated to 768
// dimensions fits the existing vector(768) column and is normalised by the API.
const EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSIONS = 768;

// gemini-embedding-2 takes no taskType; the task goes in the text itself.
const asQuery = (text: string) => `task: search result | query: ${text}`;
const asDocument = (title: string, text: string) => `title: ${title} | text: ${text}`;

async function embed(content: string): Promise<number[]> {
  const ai = getAI();

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: content,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Failed to generate embedding");
  }

  return embedding;
}

/** Embed a customer's search question. */
export function generateQueryEmbedding(query: string): Promise<number[]> {
  return embed(asQuery(query));
}

// ── Build product text for embedding ───────────────

interface ProductForEmbedding {
  id: string;
  name: string;
  description: string | null;
  material: string | null;
  price: number;
  category_name?: string | null;
}

function buildProductText(product: ProductForEmbedding): string {
  const parts = [
    product.category_name ? `Category: ${product.category_name}` : null,
    product.material ? `Material: ${product.material}` : null,
    `Price: ₹${product.price}`,
    product.description ? `Description: ${product.description}` : null,
  ];
  return parts.filter(Boolean).join(". ");
}

function toEmbeddingRow(product: ProductForEmbedding, text: string, embedding: number[]) {
  return {
    product_id: product.id,
    chunk_text: text,
    embedding: JSON.stringify(embedding),
    metadata: {
      name: product.name,
      category: product.category_name,
      material: product.material,
      price: product.price,
      model: EMBEDDING_MODEL,
    },
  };
}

// ── Upsert product embedding ───────────────────────

export async function upsertProductEmbedding(
  product: ProductForEmbedding,
): Promise<void> {
  const supabase = createAdminClient();
  const text = buildProductText(product);
  const embedding = await embed(asDocument(product.name, text));

  // Delete existing embeddings for this product
  await supabase
    .from("product_embeddings")
    .delete()
    .eq("product_id", product.id);

  // Insert new embedding
  const { error } = await supabase
    .from("product_embeddings")
    .insert(toEmbeddingRow(product, text, embedding));

  if (error) {
    throw new Error(`Failed to upsert embedding: ${error.message}`);
  }
}

// ── Load products in the shape the embedder needs ──

interface ProductRowForEmbedding {
  id: string;
  name: string;
  description: string | null;
  material: string | null;
  price: number;
  categories: { name: string } | { name: string }[] | null;
}

function toProductForEmbedding(row: ProductRowForEmbedding): ProductForEmbedding {
  const cats = row.categories;
  const categoryName = Array.isArray(cats) ? (cats[0]?.name ?? null) : (cats?.name ?? null);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    material: row.material,
    price: row.price,
    category_name: categoryName,
  };
}

const PRODUCT_FIELDS = "id, name, description, material, price, categories(name)";

/**
 * Re-embed one product after it is created or edited. Never throws: a failed embedding
 * must not fail the product save, the next bulk run picks it up.
 */
export async function refreshProductEmbedding(productId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("id", productId)
      .single();

    if (error || !data) throw new Error(error?.message ?? "product not found");
    await upsertProductEmbedding(toProductForEmbedding(data as unknown as ProductRowForEmbedding));
  } catch (err) {
    console.warn(`[embeddings] refresh failed for product ${productId}:`, err);
  }
}

// ── Batch generate embeddings for all products ─────

const EMBED_CONCURRENCY = 5;

export async function generateAllProductEmbeddings(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const products = ((rows ?? []) as unknown as ProductRowForEmbedding[]).map(toProductForEmbedding);

  // Model calls run a few at a time; the database is written once at the end.
  const embedded: ReturnType<typeof toEmbeddingRow>[] = [];
  let errors = 0;
  for (let i = 0; i < products.length; i += EMBED_CONCURRENCY) {
    const batch = products.slice(i, i + EMBED_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (product) => {
        const text = buildProductText(product);
        return toEmbeddingRow(product, text, await embed(asDocument(product.name, text)));
      }),
    );
    for (const result of results) {
      if (result.status === "fulfilled") embedded.push(result.value);
      else errors++;
    }
  }

  if (embedded.length > 0) {
    const ids = embedded.map((row) => row.product_id);
    const { error: deleteError } = await supabase
      .from("product_embeddings")
      .delete()
      .in("product_id", ids);
    if (deleteError) throw new Error(`Failed to clear embeddings: ${deleteError.message}`);

    const { error: insertError } = await supabase.from("product_embeddings").insert(embedded);
    if (insertError) throw new Error(`Failed to insert embeddings: ${insertError.message}`);
  }

  return { processed: embedded.length, errors };
}
