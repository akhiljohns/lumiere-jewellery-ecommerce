import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_CART, CUSTOMER_CART_SYNC } from "@/lib/api-routes";
import type { CartWithItems, CartWarning } from "@/features/cart/services/cart-service";

export interface LocalCartItem {
  product_id: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
}

interface CartState {
  items: LocalCartItem[];
  isSyncing: boolean;
  lastSyncWarnings: CartWarning[];

  addItem: (item: LocalCartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  syncToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      lastSyncWarnings: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === item.product_id,
          );

          if (existing) {
            const newQuantity = Math.min(
              existing.quantity + item.quantity,
              item.stock,
            );
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: newQuantity }
                  : i,
              ),
            };
          }

          const clampedQuantity = Math.min(item.quantity, item.stock);
          return {
            items: [...state.items, { ...item, quantity: clampedQuantity }],
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const item = state.items.find((i) => i.product_id === productId);
          if (!item) return state;

          const clampedQuantity = Math.min(Math.max(1, quantity), item.stock);
          return {
            items: state.items.map((i) =>
              i.product_id === productId
                ? { ...i, quantity: clampedQuantity }
                : i,
            ),
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },

      clearCart: () => {
        set({ items: [], lastSyncWarnings: [] });
      },

      syncToServer: async () => {
        const { items } = get();
        set({ isSyncing: true });

        try {
          const result = await fetchApi<{
            data: CartWithItems;
            warnings: CartWarning[];
          }>(CUSTOMER_CART_SYNC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: items.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
              })),
            }),
          });

          set({ lastSyncWarnings: result.warnings });
          await get().loadFromServer();
        } finally {
          set({ isSyncing: false });
        }
      },

      loadFromServer: async () => {
        const result = await fetchApi<{
          data: CartWithItems;
          warnings: CartWarning[];
        }>(CUSTOMER_CART);

        const serverItems: LocalCartItem[] = result.data.cart_items.map(
          (ci) => {
            const product = ci.products;
            const primaryImage = product.product_images.find(
              (img) => img.is_primary,
            );
            return {
              product_id: product.id,
              quantity: ci.quantity,
              name: product.name,
              slug: product.slug,
              price: product.price,
              compare_price: product.compare_price,
              image_url: primaryImage?.url ?? product.product_images[0]?.url ?? null,
              stock: product.stock,
              is_active: product.is_active,
            };
          },
        );

        set({ items: serverItems });
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: "guest-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
