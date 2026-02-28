import { queryOptions, useQuery } from "@tanstack/react-query";
import type {
  PaginatedProducts,
  ProductQueryParams,
} from "@/features/products/types";
import { fetchApi } from "@/lib/api-client";

export const PRODUCTS_QUERY_KEY = "products";

async function fetchProducts(
  params: ProductQueryParams,
): Promise<PaginatedProducts> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.category_id) searchParams.set("category_id", params.category_id);

  return fetchApi<PaginatedProducts>(`/api/admin/products?${searchParams}`);
}

export function getProductsQueryOptions(params: ProductQueryParams) {
  return queryOptions({
    queryKey: [PRODUCTS_QUERY_KEY, params],
    queryFn: () => fetchProducts(params),
  });
}

export function useGetProducts(params: ProductQueryParams) {
  return useQuery(getProductsQueryOptions(params));
}
