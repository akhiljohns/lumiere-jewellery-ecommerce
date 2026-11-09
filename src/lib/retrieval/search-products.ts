import { createAdminClient } from "@/lib/supabase/admin";
import { generateQueryEmbedding } from "@/lib/embeddings";
import { parseFilters, type ProductFilters, type StoreVocabulary } from "./parse-filters";

export interface RetrievedProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  material: string | null;
  weight: string | null;
  stock: number;
  is_featured: boolean;
  category_name: string | null;
  text_rank: number | null;
  semantic_rank: number | null;
  similarity: number | null;
  score: number;
}

export interface ProductSearchResult {
  products: RetrievedProduct[];
  filters: ProductFilters;
  /** false when the query embedding failed and only full-text search ran. */
  usedSemantic: boolean;
}

// Below this cosine similarity a product is not treated as a match by meaning.
// A starting value; tune it with the eval set.
const MIN_SIMILARITY = 0.5;

async function loadVocabulary(): Promise<StoreVocabulary> {
  const supabase = createAdminClient();
  const [categories, materials] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true),
    supabase.from("products").select("material").eq("is_active", true).not("material", "is", null),
  ]);

  if (categories.error) throw new Error(`Failed to load categories: ${categories.error.message}`);
  if (materials.error) throw new Error(`Failed to load materials: ${materials.error.message}`);

  return {
    categories: categories.data ?? [],
    materials: [...new Set((materials.data ?? []).map((m) => m.material as string))],
  };
}

async function embedOrNull(message: string): Promise<number[] | null> {
  try {
    return await generateQueryEmbedding(message);
  } catch (err) {
    // R7: a failed embedding falls back to full-text search instead of failing the chat.
    console.warn("[retrieval] query embedding failed, using full-text only:", err);
    return null;
  }
}

/** Hard filters from the question, then full-text and vector ranks fused in Postgres. */
export async function searchProducts(message: string, matchCount = 5): Promise<ProductSearchResult> {
  const [vocabulary, embedding] = await Promise.all([loadVocabulary(), embedOrNull(message)]);
  const filters = parseFilters(message, vocabulary);

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("search_products_hybrid", {
    query_text: message,
    query_embedding: embedding ? JSON.stringify(embedding) : null,
    category_ids: filters.categoryIds.length ? filters.categoryIds : null,
    material_names: filters.materialNames.length ? filters.materialNames : null,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    in_stock_only: filters.inStockOnly,
    on_sale_only: filters.onSaleOnly,
    match_count: matchCount,
    min_similarity: MIN_SIMILARITY,
  });

  if (error) throw new Error(`Product search failed: ${error.message}`);

  return {
    products: (data ?? []) as RetrievedProduct[],
    filters,
    usedSemantic: embedding !== null,
  };
}
