import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { AUTH_GUEST_CHECKOUT } from "@/lib/api-routes";
import { useCartStore } from "@/stores/cart-store";
import type { CartWithItems, CartWarning } from "@/features/cart/services/cart-service";
import type { SafeCustomer } from "@/features/auth/services/customer-auth-service";

interface GuestCheckoutResponse {
  data: {
    customer: SafeCustomer;
    cart: CartWithItems;
  };
  warnings: CartWarning[];
  message: string;
}

interface GuestCheckoutInput {
  email: string;
  full_name?: string | null;
  phone?: string | null;
}

/**
 * Mutation for guest checkout signup.
 * Creates an account, syncs the local cart, and sets the auth cookie.
 */
export function useGuestCheckout() {
  return useMutation({
    mutationFn: async (input: GuestCheckoutInput) => {
      const items = useCartStore.getState().items;

      const result = await fetchApi<GuestCheckoutResponse>(
        AUTH_GUEST_CHECKOUT,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            items: items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            })),
          }),
        },
      );

      // Replace local cart with server state
      await useCartStore.getState().loadFromServer();

      return result;
    },
  });
}
