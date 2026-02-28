import { queryOptions, useQuery } from "@tanstack/react-query";
import type {
  PaginatedPublicProducts,
  StorefrontProductQueryParams,
} from "@/features/storefront/types";
import { fetchApi } from "@/lib/api-client";
import { PUBLIC_PRODUCTS } from "@/lib/api-routes";

export const STOREFRONT_PRODUCTS_QUERY_KEY = "storefront-products";

async function fetchStorefrontProducts(
  params: StorefrontProductQueryParams,
): Promise<PaginatedPublicProducts> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.category_id) searchParams.set("category_id", params.category_id);
  if (params.category_slug)
    searchParams.set("category_slug", params.category_slug);
  if (params.material) searchParams.set("material", params.material);
  if (params.min_price !== undefined)
    searchParams.set("min_price", String(params.min_price));
  if (params.max_price !== undefined)
    searchParams.set("max_price", String(params.max_price));
  if (params.is_featured !== undefined)
    searchParams.set("is_featured", String(params.is_featured));

  return fetchApi<PaginatedPublicProducts>(`${PUBLIC_PRODUCTS}?${searchParams}`);
}

export function getStorefrontProductsQueryOptions(
  params: StorefrontProductQueryParams,
) {
  return queryOptions({
    queryKey: [STOREFRONT_PRODUCTS_QUERY_KEY, params],
    queryFn: () => fetchStorefrontProducts(params),
  });
}

export function useGetStorefrontProducts(
  params: StorefrontProductQueryParams,
) {
  return useQuery(getStorefrontProductsQueryOptions(params));
}
