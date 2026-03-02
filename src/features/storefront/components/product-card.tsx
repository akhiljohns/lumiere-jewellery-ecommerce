"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { PriceDisplay } from "./price-display";
import { WishlistButton } from "./wishlist-button";
import { staggerItem, cardHover } from "./motion-variants";
import { getPrimaryImage } from "@/lib/utils";
import type { PublicProduct } from "@/features/storefront/types";

interface ProductCardProps {
  product: PublicProduct;
  onQuickView?: (product: PublicProduct) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const primaryImage = getPrimaryImage(product.product_images);

  return (
    <motion.div variants={staggerItem} {...cardHover}>
      <Link
        href={`/products/${product.slug}`}
        className="group block cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-lg"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <CloudinaryImage
              src={primaryImage.url}
              alt={product.name}
              fill
              crop="fill"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground transition-colors duration-200 group-hover:text-foreground/60">
              No image
            </div>
          )}

          <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
              className="absolute inset-x-0 bottom-0 translate-y-full bg-background/90 py-2 text-center text-xs font-medium text-foreground backdrop-blur-sm transition-transform duration-200 ease-out group-hover:translate-y-0"
            >
              Quick View
            </button>
          )}
        </div>

        <div className="flex h-24 flex-col justify-between p-3">
          <div>
            <h3 className="truncate text-sm font-medium text-foreground">
              {product.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {product.categories?.name ?? "\u00A0"}
            </p>
          </div>
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
