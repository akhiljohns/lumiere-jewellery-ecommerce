import { queryOptions, useQuery } from "@tanstack/react-query";
import type {
  PaginatedPublicProducts,
  SearchQueryParams,
} from "@/features/storefront/types";
import { fetchApi } from "@/lib/api-client";
import { PUBLIC_PRODUCTS_SEARCH } from "@/lib/api-routes";

export const SEARCH_PRODUCTS_QUERY_KEY = "search-products";

async function searchProducts(
  params: SearchQueryParams,
): Promise<PaginatedPublicProducts> {
  const searchParams = new URLSearchParams();
  searchParams.set("query", params.query);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.category_id) searchParams.set("category_id", params.category_id);
  if (params.material) searchParams.set("material", params.material);
  if (params.min_price !== undefined)
    searchParams.set("min_price", String(params.min_price));
  if (params.max_price !== undefined)
    searchParams.set("max_price", String(params.max_price));

  return fetchApi<PaginatedPublicProducts>(
    `${PUBLIC_PRODUCTS_SEARCH}?${searchParams}`,
  );
}

export function getSearchProductsQueryOptions(params: SearchQueryParams) {
  return queryOptions({
    queryKey: [SEARCH_PRODUCTS_QUERY_KEY, params],
    queryFn: () => searchProducts(params),
    enabled: !!params.query,
  });
}

export function useSearchProducts(params: SearchQueryParams) {
  return useQuery(getSearchProductsQueryOptions(params));
}
