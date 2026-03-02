"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { getPrimaryImage } from "@/lib/utils";
import type { PublicProduct } from "@/features/storefront/types";

interface AddToCartButtonProps {
  product: PublicProduct;
  showQuantity?: boolean;
  fullWidth?: boolean;
  /** Use "lg" for product detail page, "default" for cards/quick-view */
  controlSize?: "default" | "lg";
}

export function AddToCartButton({
  product,
  showQuantity = true,
  fullWidth = false,
  controlSize = "default",
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) =>
    s.items.some((i) => i.product_id === product.id),
  );
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    if (outOfStock) return;

    addItem({
      product_id: product.id,
      quantity,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_price: product.compare_price,
      image_url: getPrimaryImage(product.product_images)?.url ?? null,
      stock: product.stock,
      is_active: product.is_active,
    });

    toast.success(`${product.name} added to cart`);
    setQuantity(1);
  }

  const isLarge = controlSize === "lg";
  const iconCls = isLarge ? "size-4" : "size-3";
  const qtyBtnSize = isLarge ? "icon" : "icon-sm";
  const qtyTextCls = isLarge
    ? "min-w-[3rem] text-center text-sm font-medium"
    : "min-w-[2rem] text-center text-xs font-medium";

  if (isInCart) {
    return (
      <div className={fullWidth ? "w-full" : "flex items-center gap-2"}>
        <Link
          href="/cart"
          className={buttonVariants({
            variant: "secondary",
            size: "lg",
            className: `cursor-pointer ${fullWidth ? "w-full" : ""}`,
          })}
        >
          <Check className="size-4" />
          Go to Cart
        </Link>
      </div>
    );
  }

  if (outOfStock) {
    return (
      <Button disabled className={fullWidth ? "w-full" : ""} size="lg">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className={fullWidth ? "space-y-3" : "flex items-center gap-2"}>
      {showQuantity && (
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border">
            <Button
              variant="ghost"
              size={qtyBtnSize}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus className={iconCls} />
            </Button>
            <span className={qtyTextCls}>{quantity}</span>
            <Button
              variant="ghost"
              size={qtyBtnSize}
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
            >
              <Plus className={iconCls} />
            </Button>
          </div>
          {isLarge && (
            <p className="text-xs text-muted-foreground">
              {product.stock} available
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleAdd}
        className={`cursor-pointer ${fullWidth ? "w-full" : ""}`}
        size="lg"
      >
        <ShoppingCart className="size-4" />
        Add to Cart
      </Button>
    </div>
  );
}
