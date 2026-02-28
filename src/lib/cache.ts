import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  featuredProducts: "featured-products",
} as const;

export function revalidateProductCache() {
  revalidateTag(CACHE_TAGS.products, { expire: 0 });
  revalidateTag(CACHE_TAGS.featuredProducts, { expire: 0 });
}

export function revalidateCategoryCache() {
  revalidateTag(CACHE_TAGS.categories, { expire: 0 });
}

/**
 * Wraps a function with Next.js unstable_cache for server-side caching
 * with tag-based invalidation.
 */
export function cached<T extends (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>>(
  fn: T,
  keyParts: string[],
  options: { tags: string[]; revalidate: number },
) {
  return unstable_cache(fn, keyParts, options);
}
