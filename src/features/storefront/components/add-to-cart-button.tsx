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
}

export function AddToCartButton({
  product,
  showQuantity = true,
  fullWidth = false,
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

  if (isInCart) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/cart"
          className={buttonVariants({
            variant: "secondary",
            size: "lg",
            className: fullWidth ? "flex-1" : "",
          })}
        >
          <Check className="size-4" />
          Go to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showQuantity && !outOfStock && (
        <div className="flex items-center rounded-md border border-border">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="size-3" />
          </Button>
          <span className="min-w-[2rem] text-center text-xs font-medium">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={quantity >= product.stock}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      )}

      <Button
        onClick={handleAdd}
        disabled={outOfStock}
        className={fullWidth ? "flex-1" : ""}
        size="lg"
      >
        <ShoppingCart className="size-4" />
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
