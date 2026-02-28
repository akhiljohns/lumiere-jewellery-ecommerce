import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Wishlist,
  Product,
  ProductImage,
} from "@/lib/supabase/types";

// ── Types ──────────────────────────────────────────

export interface WishlistItemWithProduct extends Wishlist {
  products: Product & { product_images: ProductImage[] };
}

// ── Get Wishlist ──────────────────────────────────

export async function getWishlist(
  customerId: string,
): Promise<WishlistItemWithProduct[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("wishlists")
    .select("*, products(*, product_images(*))")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as WishlistItemWithProduct[]) ?? [];
}

// ── Toggle (add/remove) ──────────────────────────

export async function toggleWishlistItem(
  customerId: string,
  productId: string,
): Promise<{ added: boolean }> {
  const supabase = createAdminClient();

  // Check if already wishlisted
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .single();

  if (existing) {
    // Remove
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
    return { added: false };
  }

  // Validate product exists and is active
  const { data: product } = await supabase
    .from("products")
    .select("id, is_active")
    .eq("id", productId)
    .single();

  if (!product) throw new Error("Product not found");
  if (!product.is_active) throw new Error("Product is not available");

  // Add
  const { error } = await supabase
    .from("wishlists")
    .insert({ customer_id: customerId, product_id: productId });

  if (error) throw new Error(error.message);
  return { added: true };
}

// ── Remove ───────────────────────────────────────

export async function removeWishlistItem(
  customerId: string,
  productId: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId);

  if (error) throw new Error(error.message);
}

// ── Check if wishlisted ──────────────────────────

export async function isProductWishlisted(
  customerId: string,
  productId: string,
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .single();

  return !!data;
}

// ── Check multiple products ──────────────────────

export async function getWishlistedProductIds(
  customerId: string,
  productIds: string[],
): Promise<string[]> {
  if (productIds.length === 0) return [];

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("customer_id", customerId)
    .in("product_id", productIds);

  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => d.product_id);
}
