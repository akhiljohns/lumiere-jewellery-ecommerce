"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PriceDisplay } from "../price-display";
import { WishlistButton } from "../wishlist-button";
import type { PublicProduct } from "@/features/storefront/types";

interface ProductInfoSectionProps {
  product: PublicProduct;
}

export function ProductInfoSection({ product }: ProductInfoSectionProps) {
  const inStock = product.stock > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {product.name}
          </h1>
          {product.categories && (
            <Link
              href={`/products?category=${product.categories.slug}`}
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              {product.categories.name}
            </Link>
          )}
        </div>
        <WishlistButton productId={product.id} />
      </div>

      <PriceDisplay
        price={product.price}
        comparePrice={product.compare_price}
        size="lg"
      />

      <div className="flex items-center gap-2">
        <Badge variant={inStock ? "secondary" : "destructive"}>
          {inStock ? `In Stock (${product.stock})` : "Out of Stock"}
        </Badge>
      </div>

      {product.description && (
        <>
          <Separator />
          <div>
            <h3 className="mb-1 text-xs font-medium text-foreground">
              Description
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        </>
      )}

      {(product.material || product.weight) && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            {product.material && (
              <div>
                <p className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                  Material
                </p>
                <p className="text-xs font-medium text-foreground">
                  {product.material}
                </p>
              </div>
            )}
            {product.weight && (
              <div>
                <p className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                  Weight
                </p>
                <p className="text-xs font-medium text-foreground">
                  {product.weight}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
