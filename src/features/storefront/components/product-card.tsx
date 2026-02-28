"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { PriceDisplay } from "./price-display";
import { WishlistButton } from "./wishlist-button";
import { cardHover, staggerItem } from "./motion-variants";
import { getPrimaryImage } from "@/lib/utils";
import type { PublicProduct } from "@/features/storefront/types";

interface ProductCardProps {
  product: PublicProduct;
  onQuickView?: (product: PublicProduct) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const primaryImage = getPrimaryImage(product.product_images);

  return (
    <motion.div
      variants={staggerItem}
      whileHover={cardHover.whileHover}
      whileTap={cardHover.whileTap}
      transition={cardHover.transition}
    >
      <Link
        href={`/products/${product.slug}`}
        className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {primaryImage ? (
            <CloudinaryImage
              src={primaryImage.url}
              alt={product.name}
              fill
              crop="fill"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}

          <div className="absolute top-2 right-2">
            <WishlistButton productId={product.id} />
          </div>

          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="absolute inset-x-0 bottom-0 bg-background/90 py-2 text-center text-xs font-medium text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            >
              Quick View
            </button>
          )}
        </div>

        <div className="space-y-1 p-3">
          <h3 className="truncate text-sm font-medium text-foreground">
            {product.name}
          </h3>
          {product.categories && (
            <p className="text-xs text-muted-foreground">
              {product.categories.name}
            </p>
          )}
          <PriceDisplay
            price={product.price}
            comparePrice={product.compare_price}
            size="sm"
          />
        </div>
      </Link>
    </motion.div>
  );
}
