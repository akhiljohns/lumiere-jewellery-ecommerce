import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, buildPaginationMeta } from "@/lib/utils";
import type {
  Product,
  ProductInsert,
  ProductImage,
} from "@/lib/supabase/types";
import type {
  ProductCreateInput,
  ProductUpdateInput,
  ProductQueryInput,
} from "@/lib/validators";

// ── Types ──────────────────────────────────────────

export type ProductWithImages = Product & { product_images: ProductImage[] };

export interface PaginatedProducts {
  data: ProductWithImages[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

// ── List ───────────────────────────────────────────

export async function getProducts(
  query: ProductQueryInput,
): Promise<PaginatedProducts> {
  const supabase = createAdminClient();
  const { page, limit, search, sort, order, category } = query;
  const offset = (page - 1) * limit;

  let queryBuilder = supabase
    .from("products")
    .select("*, product_images(*)", { count: "exact" });

  if (search) {
    queryBuilder = queryBuilder.ilike("name", `%${search}%`);
  }

  if (category) {
    queryBuilder = queryBuilder.eq("category", category);
  }

  queryBuilder = queryBuilder
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await queryBuilder;

  if (error) throw new Error(error.message);

  return {
    data: (data as ProductWithImages[]) ?? [],
    pagination: buildPaginationMeta(page, limit, count ?? 0),
  };
}

// ── Get Single ────────────────────────────────────

export async function getProductById(
  id: string,
): Promise<ProductWithImages | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", id)
    .single();

  if (error) return null;

  return data as ProductWithImages;
}

// ── Create ────────────────────────────────────────

export async function createProduct(
  input: ProductCreateInput,
): Promise<ProductWithImages> {
  const supabase = createAdminClient();
  const { images, ...productData } = input;

  // Generate unique slug
  let slug = slugify(productData.name);
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const insertData: ProductInsert = {
    ...productData,
    slug,
    compare_price: productData.compare_price ?? null,
    material: productData.material ?? null,
    weight: productData.weight ?? null,
  };

  const { data: product, error } = await supabase
    .from("products")
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insert images if provided
  if (images && images.length > 0) {
    const imageInserts = images.map((img, index) => ({
      product_id: product.id,
      url: img.url,
      public_id: img.public_id,
      is_primary: img.is_primary ?? index === 0,
      sort_order: index,
    }));

    const { error: imgError } = await supabase
      .from("product_images")
      .insert(imageInserts);

    if (imgError) throw new Error(imgError.message);
  }

  // Return product with images
  const result = await getProductById(product.id);
  return result!;
}

// ── Update ────────────────────────────────────────

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<ProductWithImages> {
  const supabase = createAdminClient();
  const { images, ...productData } = input;

  // If name is changing, regenerate slug
  const updateData: Record<string, unknown> = { ...productData };
  if (productData.name) {
    let slug = slugify(productData.name);
    const { data: existing } = await supabase
      .from("products")
      .select("slug, id")
      .eq("slug", slug)
      .single();

    if (existing && existing.id !== id) {
      slug = `${slug}-${Date.now()}`;
    }
    updateData.slug = slug;
  }

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);

  // If images are provided, replace all images
  if (images !== undefined) {
    // Delete existing images
    await supabase.from("product_images").delete().eq("product_id", id);

    // Insert new images
    if (images && images.length > 0) {
      const imageInserts = images.map((img, index) => ({
        product_id: id,
        url: img.url,
        public_id: img.public_id,
        is_primary: img.is_primary ?? index === 0,
        sort_order: index,
      }));

      const { error: imgError } = await supabase
        .from("product_images")
        .insert(imageInserts);

      if (imgError) throw new Error(imgError.message);
    }
  }

  const result = await getProductById(id);
  return result!;
}

// ── Delete ────────────────────────────────────────

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createAdminClient();

  // product_images cascade-deletes via FK constraint
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

// ── Categories ────────────────────────────────────

export async function getCategories(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("category")
    .order("category");

  if (error) throw new Error(error.message);

  // Deduplicate
  const unique = [...new Set((data ?? []).map((d) => d.category))];
  return unique;
}
