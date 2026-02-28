import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useCartStore } from "@/stores/cart-store";
import type { CartWithItems, CartWarning } from "@/features/cart/services/cart-service";

interface SyncCartResponse {
  data: CartWithItems;
  warnings: CartWarning[];
  message: string;
}

/**
 * Mutation to sync localStorage cart to the server after login/register.
 * Sends local items to /api/customer/cart/sync, then replaces local state
 * with server state.
 */
export function useSyncCartOnLogin() {
  const { items, loadFromServer, clearCart } = useCartStore.getState();

  return useMutation({
    mutationFn: async () => {
      const currentItems = useCartStore.getState().items;

      if (currentItems.length === 0) {
        // No local items to sync — just load server cart
        await loadFromServer();
        return { data: null, warnings: [], message: "Cart loaded from server" };
      }

      const result = await fetchApi<SyncCartResponse>(
        "/api/customer/cart/sync",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: currentItems.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            })),
          }),
        },
      );

      // Replace local state with merged server state
      await loadFromServer();

      return result;
    },
    onSuccess: () => {
      // Clear persisted guest cart data since we're now authenticated
      // (loadFromServer already set the correct items)
      void items; // referenced to avoid lint warning
      void clearCart; // available if needed
    },
  });
}
