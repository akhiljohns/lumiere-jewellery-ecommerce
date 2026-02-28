import { create } from "zustand";
import { fetchApi } from "@/lib/api-client";
import {
  CUSTOMER_WISHLIST,
  CUSTOMER_WISHLIST_CHECK,
  customerWishlistItem,
} from "@/lib/api-routes";

interface WishlistState {
  /** Set of wishlisted product IDs for fast lookup */
  items: Set<string>;
  isLoading: boolean;

  /** Load the full wishlist from the server (authenticated only) */
  loadFromServer: () => Promise<void>;

  /** Check if specific product IDs are wishlisted */
  checkProducts: (productIds: string[]) => Promise<void>;

  /** Toggle a product in the wishlist (add/remove) */
  toggle: (productId: string) => Promise<boolean>;

  /** Remove a product from the wishlist */
  remove: (productId: string) => Promise<void>;

  /** Check if a product is wishlisted (local state) */
  isWishlisted: (productId: string) => boolean;

  /** Clear local state (e.g., on logout) */
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: new Set<string>(),
  isLoading: false,

  loadFromServer: async () => {
    set({ isLoading: true });
    try {
      const result = await fetchApi<{
        data: Array<{ product_id: string }>;
      }>(CUSTOMER_WISHLIST);

      set({
        items: new Set(result.data.map((item) => item.product_id)),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  checkProducts: async (productIds) => {
    if (productIds.length === 0) return;

    const params = new URLSearchParams();
    params.set("product_ids", productIds.join(","));

    const result = await fetchApi<{
      data: { wishlisted_product_ids: string[] };
    }>(`${CUSTOMER_WISHLIST_CHECK}?${params}`);

    set((state) => {
      const newItems = new Set(state.items);
      for (const id of result.data.wishlisted_product_ids) {
        newItems.add(id);
      }
      return { items: newItems };
    });
  },

  toggle: async (productId) => {
    const result = await fetchApi<{
      data: { added: boolean };
    }>(CUSTOMER_WISHLIST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });

    set((state) => {
      const newItems = new Set(state.items);
      if (result.data.added) {
        newItems.add(productId);
      } else {
        newItems.delete(productId);
      }
      return { items: newItems };
    });

    return result.data.added;
  },

  remove: async (productId) => {
    await fetchApi(customerWishlistItem(productId), {
      method: "DELETE",
    });

    set((state) => {
      const newItems = new Set(state.items);
      newItems.delete(productId);
      return { items: newItems };
    });
  },

  isWishlisted: (productId) => {
    return get().items.has(productId);
  },

  clear: () => {
    set({ items: new Set() });
  },
}));
