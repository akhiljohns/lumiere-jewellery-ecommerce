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

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSIONS = 768;

export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getAI();

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Failed to generate embedding");
  }

  return embedding;
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
    `Product: ${product.name}`,
    product.category_name ? `Category: ${product.category_name}` : null,
    product.material ? `Material: ${product.material}` : null,
    `Price: ₹${product.price}`,
    product.description ? `Description: ${product.description}` : null,
  ];
  return parts.filter(Boolean).join(". ");
}

// ── Upsert product embedding ───────────────────────

export async function upsertProductEmbedding(
  product: ProductForEmbedding,
): Promise<void> {
  const supabase = createAdminClient();
  const text = buildProductText(product);
  const embedding = await generateEmbedding(text);

  // Delete existing embeddings for this product
  await supabase
    .from("product_embeddings")
    .delete()
    .eq("product_id", product.id);

  // Insert new embedding
  const { error } = await supabase.from("product_embeddings").insert({
    product_id: product.id,
    chunk_text: text,
    embedding: JSON.stringify(embedding),
    metadata: {
      name: product.name,
      category: product.category_name,
      material: product.material,
      price: product.price,
    },
  });

  if (error) {
    throw new Error(`Failed to upsert embedding: ${error.message}`);
  }
}

// ── Batch generate embeddings for all products ─────

export async function generateAllProductEmbeddings(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, material, price, category_id, categories(name)")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  let processed = 0;
  let errors = 0;

  for (const product of products ?? []) {
    try {
      const cats = product.categories as unknown as { name: string } | { name: string }[] | null;
      const categoryName = Array.isArray(cats) ? (cats[0]?.name ?? null) : (cats?.name ?? null);
      await upsertProductEmbedding({
        id: product.id,
        name: product.name,
        description: product.description,
        material: product.material,
        price: product.price,
        category_name: categoryName,
      });
      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}

// ── Semantic search (vector similarity) ────────────

interface VectorSearchResult {
  product_id: string;
  chunk_text: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export async function vectorSearch(
  query: string,
  topK: number = 5,
): Promise<VectorSearchResult[]> {
  const supabase = createAdminClient();
  const queryEmbedding = await generateEmbedding(query);

  // Use Supabase RPC for vector similarity search
  const { data, error } = await supabase.rpc("match_product_embeddings", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: topK,
    match_threshold: 0.3,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return (data ?? []).map((row: { product_id: string; chunk_text: string; similarity: number; metadata: Record<string, unknown> }) => ({
    product_id: row.product_id,
    chunk_text: row.chunk_text,
    similarity: row.similarity,
    metadata: row.metadata ?? {},
  }));
}
