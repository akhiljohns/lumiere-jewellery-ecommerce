"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { PriceDisplay } from "../price-display";
import { AddToCartButton } from "../add-to-cart-button";
import { getPrimaryImage } from "@/lib/utils";
import type { PublicProduct } from "@/features/storefront/types";

interface QuickViewModalProps {
  product: PublicProduct | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  if (!product) return null;

  const primaryImage = getPrimaryImage(product.product_images);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
            {primaryImage ? (
              <CloudinaryImage
                src={primaryImage.url}
                alt={product.name}
                fill
                crop="fill"
                sizes="(max-width: 640px) 100vw, 200px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {product.name}
              </h3>
              {product.categories && (
                <p className="text-xs text-muted-foreground">
                  {product.categories.name}
                </p>
              )}
            </div>

            <PriceDisplay
              price={product.price}
              comparePrice={product.compare_price}
            />

            {product.description && (
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}

            <div className="mt-auto space-y-2">
              <AddToCartButton product={product} showQuantity={false} />
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
              >
                <Button variant="outline" className="w-full" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
