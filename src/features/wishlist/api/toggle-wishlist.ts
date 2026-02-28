import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_WISHLIST } from "@/lib/api-routes";
import { WISHLIST_QUERY_KEY } from "./get-wishlist";

interface ToggleWishlistResponse {
  data: { added: boolean };
  message: string;
}

async function toggleWishlist(
  productId: string,
): Promise<ToggleWishlistResponse> {
  return fetchApi<ToggleWishlistResponse>(CUSTOMER_WISHLIST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] });
    },
  });
}
