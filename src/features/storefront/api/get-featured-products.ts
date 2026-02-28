import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PublicProduct } from "@/features/storefront/types";
import { fetchApi } from "@/lib/api-client";
import { PUBLIC_PRODUCTS_FEATURED } from "@/lib/api-routes";

export const FEATURED_PRODUCTS_QUERY_KEY = "featured-products";

async function fetchFeaturedProducts(
  limit: number = 8,
): Promise<{ data: PublicProduct[] }> {
  const searchParams = new URLSearchParams();
  if (limit !== 8) searchParams.set("limit", String(limit));

  const qs = searchParams.toString();
  return fetchApi<{ data: PublicProduct[] }>(
    `${PUBLIC_PRODUCTS_FEATURED}${qs ? `?${qs}` : ""}`,
  );
}

export function getFeaturedProductsQueryOptions(limit: number = 8) {
  return queryOptions({
    queryKey: [FEATURED_PRODUCTS_QUERY_KEY, limit],
    queryFn: () => fetchFeaturedProducts(limit),
  });
}

export function useGetFeaturedProducts(limit: number = 8) {
  return useQuery(getFeaturedProductsQueryOptions(limit));
}
