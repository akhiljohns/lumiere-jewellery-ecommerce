"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export default function LogoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const clearWishlist = useWishlistStore((s) => s.clear);

  useEffect(() => {
    async function performLogout() {
      try {
        await fetchApi("/api/auth/customer-logout", { method: "POST" });
      } catch {
        // Ignore errors — still redirect
      }

      // Clear all client-side state
      clearCart();
      clearWishlist();
      queryClient.clear();

      router.push("/");
      router.refresh();
    }
    performLogout();
  }, [router, queryClient, clearCart, clearWishlist]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
