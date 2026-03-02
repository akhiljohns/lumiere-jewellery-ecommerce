"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { getPrimaryImage } from "@/lib/utils";
import type { PublicProduct } from "@/features/storefront/types";

interface AddToCartSectionProps {
  product: PublicProduct;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
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

  if (outOfStock) {
    return (
      <Button disabled className="w-full" size="lg">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-sm font-medium">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={quantity >= product.stock}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {product.stock} available
        </p>
      </div>

      <Button onClick={handleAdd} className="w-full" size="lg">
        <ShoppingCart className="size-4" />
        Add to Cart
      </Button>
    </div>
  );
}
