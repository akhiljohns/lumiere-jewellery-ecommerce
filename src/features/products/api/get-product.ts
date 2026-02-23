import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ProductWithImages } from "@/features/products/types";
import { fetchApi } from "@/lib/api-client";

export const PRODUCT_QUERY_KEY = "product";

async function fetchProduct(
  id: string,
): Promise<{ data: ProductWithImages }> {
  return fetchApi<{ data: ProductWithImages }>(`/api/admin/products/${id}`);
}

export function getProductQueryOptions(id: string) {
  return queryOptions({
    queryKey: [PRODUCT_QUERY_KEY, id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

export function useGetProduct(id: string) {
  return useQuery(getProductQueryOptions(id));
}
