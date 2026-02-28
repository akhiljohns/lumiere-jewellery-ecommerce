import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, buildPaginationMeta } from "@/lib/utils";
import type { Category, CategoryInsert } from "@/lib/supabase/types";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryQueryInput,
} from "@/lib/validators";

// ── Types ──────────────────────────────────────────

export type CategoryWithChildren = Category & {
  children?: Category[];
};

export interface PaginatedCategories {
  data: Category[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

// ── List ───────────────────────────────────────────

export async function getCategories(
  query: CategoryQueryInput,
): Promise<PaginatedCategories> {
  const supabase = createAdminClient();
  const { page, limit, search, sort, order, parent_id, active_only } = query;
  const offset = (page - 1) * limit;

  let queryBuilder = supabase
    .from("categories")
    .select("*", { count: "exact" });

  if (search) {
    queryBuilder = queryBuilder.ilike("name", `%${search}%`);
  }

  if (parent_id) {
    queryBuilder = queryBuilder.eq("parent_id", parent_id);
  }

  if (active_only) {
    queryBuilder = queryBuilder.eq("is_active", true);
  }

  queryBuilder = queryBuilder
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await queryBuilder;

  if (error) throw new Error(error.message);

  return {
    data: (data as Category[]) ?? [],
    pagination: buildPaginationMeta(page, limit, count ?? 0),
  };
}

// ── Get Single ────────────────────────────────────

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;

  return data as Category;
}

// ── Get by Slug ───────────────────────────────────

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;

  return data as Category;
}

// ── Get Hierarchy (tree) ──────────────────────────

export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  const categories = (data as Category[]) ?? [];

  // Build tree from flat list
  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ── Get Children ──────────────────────────────────

export async function getCategoryChildren(
  parentId: string,
): Promise<Category[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data as Category[]) ?? [];
}

// ── Create ────────────────────────────────────────

export async function createCategory(
  input: CategoryCreateInput,
): Promise<Category> {
  const supabase = createAdminClient();

  // Generate unique slug
  let slug = slugify(input.name);
  const { data: existing } = await supabase
    .from("categories")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  // Validate parent exists if provided
  if (input.parent_id) {
    const parent = await getCategoryById(input.parent_id);
    if (!parent) {
      throw new Error("Parent category not found");
    }
  }

  const insertData: CategoryInsert = {
    name: input.name,
    slug,
    parent_id: input.parent_id ?? null,
    image_url: input.image_url ?? null,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
  };

  const { data: category, error } = await supabase
    .from("categories")
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return category as Category;
}

// ── Update ────────────────────────────────────────

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput,
): Promise<Category> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = { ...input };

  // If name is changing, regenerate slug
  if (input.name) {
    let slug = slugify(input.name);
    const { data: existing } = await supabase
      .from("categories")
      .select("slug, id")
      .eq("slug", slug)
      .single();

    if (existing && existing.id !== id) {
      slug = `${slug}-${Date.now()}`;
    }
    updateData.slug = slug;
  }

  // Prevent setting parent_id to self or own descendant
  if (input.parent_id) {
    if (input.parent_id === id) {
      throw new Error("A category cannot be its own parent");
    }

    const parent = await getCategoryById(input.parent_id);
    if (!parent) {
      throw new Error("Parent category not found");
    }

    // Check for circular reference: walk up the parent chain
    let current = parent;
    while (current.parent_id) {
      if (current.parent_id === id) {
        throw new Error("Circular parent reference detected");
      }
      const next = await getCategoryById(current.parent_id);
      if (!next) break;
      current = next;
    }
  }

  const { error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);

  const result = await getCategoryById(id);
  return result!;
}

// ── Delete ────────────────────────────────────────

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createAdminClient();

  // Children will have parent_id set to null via ON DELETE SET NULL
  // Products referencing this category will have category_id set to null
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
