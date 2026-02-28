import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Cart,
  CartItem,
  Product,
  ProductImage,
} from "@/lib/supabase/types";

// ── Types ──────────────────────────────────────────

export interface CartItemWithProduct extends CartItem {
  products: Product & { product_images: ProductImage[] };
}

export interface CartWithItems extends Cart {
  cart_items: CartItemWithProduct[];
}

export interface CartWarning {
  type: "out_of_stock" | "insufficient_stock" | "product_inactive" | "product_not_found";
  product_id: string;
  message: string;
}

export interface CartResult<T> {
  data: T;
  warnings: CartWarning[];
}

// ── Helpers ────────────────────────────────────────

async function getOrCreateCart(customerId: string): Promise<Cart> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("carts")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ customer_id: customerId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created;
}

// ── Get Cart ───────────────────────────────────────

export async function getCartWithItems(
  customerId: string,
): Promise<CartResult<CartWithItems>> {
  const supabase = createAdminClient();
  const cart = await getOrCreateCart(customerId);

  const { data: items, error } = await supabase
    .from("cart_items")
    .select("*, products(*, product_images(*))")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return {
    data: {
      ...cart,
      cart_items: (items as CartItemWithProduct[]) ?? [],
    },
    warnings: [],
  };
}

// ── Add Item ───────────────────────────────────────

export async function addItemToCart(
  customerId: string,
  productId: string,
  quantity: number,
): Promise<CartResult<CartWithItems>> {
  const supabase = createAdminClient();
  const cart = await getOrCreateCart(customerId);
  const warnings: CartWarning[] = [];

  // Validate product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock, is_active")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    throw new Error("Product not found");
  }

  if (!product.is_active) {
    throw new Error("Product is not available");
  }

  if (product.stock <= 0) {
    throw new Error("Product is out of stock");
  }

  let finalQuantity = quantity;
  if (finalQuantity > product.stock) {
    finalQuantity = product.stock;
    warnings.push({
      type: "insufficient_stock",
      product_id: productId,
      message: `Only ${product.stock} available. Quantity adjusted.`,
    });
  }

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .single();

  if (existingItem) {
    let newQuantity = existingItem.quantity + finalQuantity;
    if (newQuantity > product.stock) {
      newQuantity = product.stock;
      warnings.push({
        type: "insufficient_stock",
        product_id: productId,
        message: `Only ${product.stock} available. Quantity adjusted.`,
      });
    }

    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existingItem.id);

    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: insertError } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cart.id,
        product_id: productId,
        quantity: finalQuantity,
      });

    if (insertError) throw new Error(insertError.message);
  }

  const result = await getCartWithItems(customerId);
  return { data: result.data, warnings };
}

// ── Update Quantity ────────────────────────────────

export async function updateCartItemQuantity(
  customerId: string,
  productId: string,
  quantity: number,
): Promise<CartResult<CartWithItems>> {
  const supabase = createAdminClient();
  const cart = await getOrCreateCart(customerId);
  const warnings: CartWarning[] = [];

  // Validate product stock
  const { data: product } = await supabase
    .from("products")
    .select("id, stock, is_active")
    .eq("id", productId)
    .single();

  if (!product) throw new Error("Product not found");
  if (!product.is_active) throw new Error("Product is not available");

  let finalQuantity = quantity;
  if (finalQuantity > product.stock) {
    finalQuantity = product.stock;
    warnings.push({
      type: "insufficient_stock",
      product_id: productId,
      message: `Only ${product.stock} available. Quantity adjusted.`,
    });
  }

  if (product.stock <= 0) {
    // Remove the item instead
    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    warnings.push({
      type: "out_of_stock",
      product_id: productId,
      message: "Product is out of stock. Removed from cart.",
    });

    const result = await getCartWithItems(customerId);
    return { data: result.data, warnings };
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: finalQuantity })
    .eq("cart_id", cart.id)
    .eq("product_id", productId);

  if (error) throw new Error(error.message);

  const result = await getCartWithItems(customerId);
  return { data: result.data, warnings };
}

// ── Remove Item ────────────────────────────────────

export async function removeCartItem(
  customerId: string,
  productId: string,
): Promise<CartResult<CartWithItems>> {
  const supabase = createAdminClient();
  const cart = await getOrCreateCart(customerId);

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id)
    .eq("product_id", productId);

  if (error) throw new Error(error.message);

  const result = await getCartWithItems(customerId);
  return { data: result.data, warnings: [] };
}

// ── Clear Cart ─────────────────────────────────────

export async function clearCart(
  customerId: string,
): Promise<CartResult<CartWithItems>> {
  const supabase = createAdminClient();
  const cart = await getOrCreateCart(customerId);

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (error) throw new Error(error.message);

  const result = await getCartWithItems(customerId);
  return { data: result.data, warnings: [] };
}

// ── Sync Cart (merge localStorage → server) ───────

export async function syncCart(
  customerId: string,
  items: { product_id: string; quantity: number }[],
): Promise<CartResult<CartWithItems>> {
  const supabase = createAdminClient();
  const cart = await getOrCreateCart(customerId);
  const warnings: CartWarning[] = [];

  if (items.length === 0) {
    const result = await getCartWithItems(customerId);
    return { data: result.data, warnings };
  }

  // Fetch all referenced products in one query
  const productIds = items.map((i) => i.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, stock, is_active")
    .in("id", productIds);

  const productMap = new Map(
    (products ?? []).map((p) => [p.id, p]),
  );

  // Fetch existing cart items
  const { data: existingItems } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity")
    .eq("cart_id", cart.id);

  const existingMap = new Map(
    (existingItems ?? []).map((i) => [i.product_id, i]),
  );

  for (const item of items) {
    const product = productMap.get(item.product_id);

    if (!product) {
      warnings.push({
        type: "product_not_found",
        product_id: item.product_id,
        message: "Product not found. Skipped.",
      });
      continue;
    }

    if (!product.is_active) {
      warnings.push({
        type: "product_inactive",
        product_id: item.product_id,
        message: "Product is no longer available. Skipped.",
      });
      continue;
    }

    if (product.stock <= 0) {
      warnings.push({
        type: "out_of_stock",
        product_id: item.product_id,
        message: "Product is out of stock. Skipped.",
      });
      continue;
    }

    const existing = existingMap.get(item.product_id);
    // Max-quantity merge strategy
    const mergedQuantity = existing
      ? Math.max(existing.quantity, item.quantity)
      : item.quantity;

    let finalQuantity = mergedQuantity;
    if (finalQuantity > product.stock) {
      finalQuantity = product.stock;
      warnings.push({
        type: "insufficient_stock",
        product_id: item.product_id,
        message: `Only ${product.stock} available. Quantity adjusted.`,
      });
    }

    if (existing) {
      if (existing.quantity !== finalQuantity) {
        await supabase
          .from("cart_items")
          .update({ quantity: finalQuantity })
          .eq("id", existing.id);
      }
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cart.id,
        product_id: item.product_id,
        quantity: finalQuantity,
      });
    }
  }

  const result = await getCartWithItems(customerId);
  return { data: result.data, warnings };
}

// ── Validate Cart for Checkout ─────────────────────

export async function validateCartForCheckout(
  customerId: string,
): Promise<CartResult<CartWithItems>> {
  const supabase = createAdminClient();
  const cart = await getOrCreateCart(customerId);
  const warnings: CartWarning[] = [];

  const { data: items } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity, products(id, stock, is_active)")
    .eq("cart_id", cart.id);

  if (!items || items.length === 0) {
    const result = await getCartWithItems(customerId);
    return { data: result.data, warnings };
  }

  for (const item of items) {
    const product = item.products as unknown as {
      id: string;
      stock: number;
      is_active: boolean;
    } | null;

    // Product deleted or not found
    if (!product) {
      await supabase.from("cart_items").delete().eq("id", item.id);
      warnings.push({
        type: "product_not_found",
        product_id: item.product_id,
        message: "Product no longer exists. Removed from cart.",
      });
      continue;
    }

    // Product inactive
    if (!product.is_active) {
      await supabase.from("cart_items").delete().eq("id", item.id);
      warnings.push({
        type: "product_inactive",
        product_id: item.product_id,
        message: "Product is no longer available. Removed from cart.",
      });
      continue;
    }

    // Out of stock
    if (product.stock <= 0) {
      await supabase.from("cart_items").delete().eq("id", item.id);
      warnings.push({
        type: "out_of_stock",
        product_id: item.product_id,
        message: "Product is out of stock. Removed from cart.",
      });
      continue;
    }

    // Insufficient stock — clamp
    if (item.quantity > product.stock) {
      await supabase
        .from("cart_items")
        .update({ quantity: product.stock })
        .eq("id", item.id);
      warnings.push({
        type: "insufficient_stock",
        product_id: item.product_id,
        message: `Only ${product.stock} available. Quantity adjusted from ${item.quantity}.`,
      });
    }
  }

  const result = await getCartWithItems(customerId);
  return { data: result.data, warnings };
}
