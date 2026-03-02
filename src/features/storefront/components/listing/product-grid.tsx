"use client";

import { motion } from "framer-motion";
import { PackageOpen } from "lucide-react";

import { ProductCard } from "../product-card";
import { staggerContainer } from "../motion-variants";
import type { PublicProduct } from "@/features/storefront/types";

interface ProductGridProps {
  products: PublicProduct[];
  onQuickView?: (product: PublicProduct) => void;
}

export function ProductGrid({ products, onQuickView }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <PackageOpen className="size-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          No products found
        </p>
        <p className="text-xs text-muted-foreground/70">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onQuickView={onQuickView}
        />
      ))}
    </motion.div>
  );
}
