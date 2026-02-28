import { queryOptions, useQuery } from "@tanstack/react-query";
import type { WishlistItemWithProduct } from "@/features/wishlist/services/wishlist-service";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_WISHLIST } from "@/lib/api-routes";

export const WISHLIST_QUERY_KEY = "wishlist";

async function fetchWishlist(): Promise<{ data: WishlistItemWithProduct[] }> {
  return fetchApi<{ data: WishlistItemWithProduct[] }>(CUSTOMER_WISHLIST);
}

export function getWishlistQueryOptions() {
  return queryOptions({
    queryKey: [WISHLIST_QUERY_KEY],
    queryFn: fetchWishlist,
  });
}

export function useGetWishlist() {
  return useQuery(getWishlistQueryOptions());
}
