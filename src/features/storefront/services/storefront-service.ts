import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaginationMeta } from "@/lib/utils";
import { cached, CACHE_TAGS } from "@/lib/cache";
import type {
  Product,
  ProductImage,
  Category,
} from "@/lib/supabase/types";
import type {
  PublicProductQueryInput,
  SearchQueryInput,
} from "@/lib/validators";

// ── Types ──────────────────────────────────────────

export type PublicProduct = Product & {
  product_images: ProductImage[];
  categories: Category | null;
};

export interface PaginatedPublicProducts {
  data: PublicProduct[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

export type CategoryWithCount = Category & {
  product_count: number;
};

// ── Public Product List ────────────────────────────

async function _getPublicProducts(
  query: PublicProductQueryInput,
): Promise<PaginatedPublicProducts> {
  const supabase = createAdminClient();
  const {
    page,
    limit,
    search,
    sort,
    order,
    category_id,
    category_slug,
    material,
    min_price,
    max_price,
    is_featured,
  } = query;
  const offset = (page - 1) * limit;

  let queryBuilder = supabase
    .from("products")
    .select("*, product_images(*), categories(*)", { count: "exact" })
    .eq("is_active", true);

  // Filter by category ID
  if (category_id) {
    queryBuilder = queryBuilder.eq("category_id", category_id);
  }

  // Filter by category slug (resolve to ID first)
  if (category_slug && !category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category_slug)
      .single();

    if (cat) {
      queryBuilder = queryBuilder.eq("category_id", cat.id);
    } else {
      // No matching category — return empty
      return {
        data: [],
        pagination: buildPaginationMeta(page, limit, 0),
      };
    }
  }

  // Filter by material
  if (material) {
    queryBuilder = queryBuilder.ilike("material", material);
  }

  // Price range
  if (min_price !== undefined) {
    queryBuilder = queryBuilder.gte("price", min_price);
  }
  if (max_price !== undefined) {
    queryBuilder = queryBuilder.lte("price", max_price);
  }

  // Featured filter
  if (is_featured !== undefined) {
    queryBuilder = queryBuilder.eq("is_featured", is_featured);
  }

  // Text search (simple ilike on name — full-text via /search endpoint)
  if (search) {
    queryBuilder = queryBuilder.ilike("name", `%${search}%`);
  }

  queryBuilder = queryBuilder
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await queryBuilder;

  if (error) throw new Error(error.message);

  return {
    data: (data as PublicProduct[]) ?? [],
    pagination: buildPaginationMeta(page, limit, count ?? 0),
  };
}

export const getPublicProducts = cached(
  _getPublicProducts,
  ["public-products"],
  { tags: [CACHE_TAGS.products], revalidate: 60 },
);

// ── Product Detail by Slug ─────────────────────────

async function _getProductBySlug(
  slug: string,
): Promise<{ product: PublicProduct; related: PublicProduct[] } | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  const product = data as PublicProduct;

  // Fetch related products (same category, excluding self)
  let related: PublicProduct[] = [];
  if (product.category_id) {
    const { data: relatedData } = await supabase
      .from("products")
      .select("*, product_images(*), categories(*)")
      .eq("category_id", product.category_id)
      .eq("is_active", true)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(4);

    related = (relatedData as PublicProduct[]) ?? [];
  }

  return { product, related };
}

export const getProductBySlug = cached(
  _getProductBySlug,
  ["product-by-slug"],
  { tags: [CACHE_TAGS.products], revalidate: 60 },
);

// ── Featured Products ──────────────────────────────

async function _getFeaturedProducts(
  limit: number = 8,
): Promise<PublicProduct[]> {
  const supabase = createAdminClient();

  // First try curated featured products
  const { data: featured, error } = await supabase
    .from("products")
    .select("*, product_images(*), categories(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  // If not enough featured products, supplement with latest
  if ((featured?.length ?? 0) < limit) {
    const existingIds = (featured ?? []).map((p) => p.id);
    const remaining = limit - (featured?.length ?? 0);

    const { data: latest } = await supabase
      .from("products")
      .select("*, product_images(*), categories(*)")
      .eq("is_active", true)
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(remaining);

    return [
      ...((featured as PublicProduct[]) ?? []),
      ...((latest as PublicProduct[]) ?? []),
    ];
  }

  return (featured as PublicProduct[]) ?? [];
}

export const getFeaturedProducts = cached(
  _getFeaturedProducts,
  ["featured-products"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.featuredProducts], revalidate: 120 },
);

// ── Public Categories with Product Counts ──────────

async function _getPublicCategories(): Promise<CategoryWithCount[]> {
  const supabase = createAdminClient();

  // Get active categories
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  if (!categories || categories.length === 0) return [];

  // Get product counts per category (only active products)
  const { data: counts, error: countError } = await supabase
    .rpc("get_category_product_counts");

  // If RPC doesn't exist, fall back to manual counting
  if (countError) {
    const categoryIds = categories.map((c) => c.id);
    const { data: products } = await supabase
      .from("products")
      .select("category_id")
      .eq("is_active", true)
      .in("category_id", categoryIds);

    const countMap = new Map<string, number>();
    for (const p of products ?? []) {
      if (p.category_id) {
        countMap.set(p.category_id, (countMap.get(p.category_id) ?? 0) + 1);
      }
    }

    return categories.map((cat) => ({
      ...(cat as Category),
      product_count: countMap.get(cat.id) ?? 0,
    }));
  }

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.category_id, row.product_count);
  }

  return categories.map((cat) => ({
    ...(cat as Category),
    product_count: countMap.get(cat.id) ?? 0,
  }));
}

export const getPublicCategories = cached(
  _getPublicCategories,
  ["public-categories"],
  { tags: [CACHE_TAGS.categories], revalidate: 300 },
);

// ── Full-Text Search ───────────────────────────────

async function _searchProducts(
  query: SearchQueryInput,
): Promise<PaginatedPublicProducts> {
  const supabase = createAdminClient();
  const { query: searchQuery, page, limit, sort, order, category_id, material, min_price, max_price } = query;
  const offset = (page - 1) * limit;

  // Use PostgreSQL full-text search via textSearch
  let queryBuilder = supabase
    .from("products")
    .select("*, product_images(*), categories(*)", { count: "exact" })
    .eq("is_active", true)
    .textSearch("search_vector", searchQuery, {
      type: "websearch",
      config: "english",
    });

  if (category_id) {
    queryBuilder = queryBuilder.eq("category_id", category_id);
  }

  if (material) {
    queryBuilder = queryBuilder.ilike("material", material);
  }

  if (min_price !== undefined) {
    queryBuilder = queryBuilder.gte("price", min_price);
  }

  if (max_price !== undefined) {
    queryBuilder = queryBuilder.lte("price", max_price);
  }

  queryBuilder = queryBuilder
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await queryBuilder;

  if (error) throw new Error(error.message);

  return {
    data: (data as PublicProduct[]) ?? [],
    pagination: buildPaginationMeta(page, limit, count ?? 0),
  };
}

export const searchProducts = cached(
  _searchProducts,
  ["search-products"],
  { tags: [CACHE_TAGS.products], revalidate: 30 },
);
