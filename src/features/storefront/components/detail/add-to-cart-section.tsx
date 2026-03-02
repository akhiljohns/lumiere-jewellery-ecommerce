"use client";

import { AddToCartButton } from "../add-to-cart-button";
import type { PublicProduct } from "@/features/storefront/types";

interface AddToCartSectionProps {
  product: PublicProduct;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  return (
    <AddToCartButton
      product={product}
      showQuantity
      fullWidth
      controlSize="lg"
    />
  );
}
