import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_WISHLIST_CHECK } from "@/lib/api-routes";

export const WISHLIST_CHECK_QUERY_KEY = "wishlist-check";

interface WishlistCheckResponse {
  data: { wishlisted_product_ids: string[] };
}

async function checkWishlist(
  productIds: string[],
): Promise<WishlistCheckResponse> {
  const params = new URLSearchParams();
  params.set("product_ids", productIds.join(","));
  return fetchApi<WishlistCheckResponse>(
    `${CUSTOMER_WISHLIST_CHECK}?${params}`,
  );
}

export function getWishlistCheckQueryOptions(productIds: string[]) {
  return queryOptions({
    queryKey: [WISHLIST_CHECK_QUERY_KEY, productIds],
    queryFn: () => checkWishlist(productIds),
    enabled: productIds.length > 0,
  });
}

export function useCheckWishlist(productIds: string[]) {
  return useQuery(getWishlistCheckQueryOptions(productIds));
}
