import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PublicProduct } from "@/features/storefront/types";
import { fetchApi } from "@/lib/api-client";
import { publicProduct } from "@/lib/api-routes";

export const STOREFRONT_PRODUCT_QUERY_KEY = "storefront-product";

interface ProductDetailResponse {
  data: PublicProduct;
  related: PublicProduct[];
}

async function fetchStorefrontProduct(
  slug: string,
): Promise<ProductDetailResponse> {
  return fetchApi<ProductDetailResponse>(publicProduct(slug));
}

export function getStorefrontProductQueryOptions(slug: string) {
  return queryOptions({
    queryKey: [STOREFRONT_PRODUCT_QUERY_KEY, slug],
    queryFn: () => fetchStorefrontProduct(slug),
    enabled: !!slug,
  });
}

export function useGetStorefrontProduct(slug: string) {
  return useQuery(getStorefrontProductQueryOptions(slug));
}
