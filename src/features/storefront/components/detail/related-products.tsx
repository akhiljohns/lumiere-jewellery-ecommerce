"use client";

import { motion } from "framer-motion";

import { ProductCard } from "../product-card";
import { staggerContainer } from "../motion-variants";
import type { PublicProduct } from "@/features/storefront/types";

interface RelatedProductsProps {
  products: PublicProduct[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-10">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        You May Also Like
      </h2>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </motion.div>
    </section>
  );
}
