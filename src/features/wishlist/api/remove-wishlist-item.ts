import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { customerWishlistItem } from "@/lib/api-routes";
import { WISHLIST_QUERY_KEY } from "./get-wishlist";

async function removeWishlistItem(productId: string) {
  return fetchApi(customerWishlistItem(productId), {
    method: "DELETE",
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeWishlistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] });
    },
  });
}
