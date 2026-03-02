"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { PriceDisplay } from "./price-display";
import { WishlistButton } from "./wishlist-button";
import { AddToCartButton } from "./add-to-cart-button";
import { staggerItem, cardHover } from "./motion-variants";
import { getPlaceholderImage } from "./placeholder-images";
import { getPrimaryImage } from "@/lib/utils";
import type { PublicProduct } from "@/features/storefront/types";

interface ProductCardProps {
  product: PublicProduct;
  onQuickView?: (product: PublicProduct) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const primaryImage = getPrimaryImage(product.product_images);
  const lowStock = product.stock > 0 && product.stock <= 5;
  const outOfStock = product.stock <= 0;

  return (
    <motion.div variants={staggerItem} {...cardHover}>
      <div className="group overflow-hidden rounded-lg border border-border bg-card transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-lg">
        <Link
          href={`/products/${product.slug}`}
          className="block cursor-pointer"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            {primaryImage ? (
              <CloudinaryImage
                src={primaryImage.url}
                alt={product.name}
                fill
                crop="fill"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <Image
                src={getPlaceholderImage(product.id)}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            )}

            {/* Stock badges */}
            {outOfStock && (
              <div className="absolute top-2 left-2 rounded-full bg-muted px-2.5 py-1 text-[0.625rem] font-medium text-muted-foreground">
                Sold Out
              </div>
            )}
            {lowStock && !outOfStock && (
              <div className="absolute top-2 left-2 rounded-full bg-destructive/90 px-2.5 py-1 text-[0.625rem] font-medium text-primary-foreground">
                Only {product.stock} left
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

          <div className="p-3">
            <p className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">
              {product.categories?.name ?? "\u00A0"}
            </p>
            <h3 className="mt-0.5 truncate text-sm font-semibold font-display text-foreground">
              {product.name}
            </h3>
            <div className="mt-1.5">
              <PriceDisplay
                price={product.price}
                comparePrice={product.compare_price}
                size="sm"
              />
            </div>
          </div>
        </Link>

        {/* Add to Cart — outside the Link to avoid nested interactives */}
        <div className="px-3 pb-3">
          <AddToCartButton
            product={product}
            showQuantity={false}
            fullWidth
          />
        </div>
      </div>
    </motion.div>
  );
}
