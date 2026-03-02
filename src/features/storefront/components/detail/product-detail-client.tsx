"use client";

import { ProductImageGallery } from "./product-image-gallery";
import { ProductInfoSection } from "./product-info-section";
import { AddToCartSection } from "./add-to-cart-section";
import { Separator } from "@/components/ui/separator";
import type { PublicProduct } from "@/features/storefront/types";

interface ProductDetailClientProps {
  product: PublicProduct;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Image Gallery */}
      <ProductImageGallery
        images={product.product_images}
        productName={product.name}
      />

      {/* Product Info + Add to Cart */}
      <div className="space-y-6">
        <ProductInfoSection product={product} />
        <Separator />
        <AddToCartSection product={product} />
      </div>
    </div>
  );
}
