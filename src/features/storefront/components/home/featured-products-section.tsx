"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "../product-card";
import { staggerContainer, sectionHeading } from "../motion-variants";
import type { PublicProduct } from "@/features/storefront/types";

interface FeaturedProductsSectionProps {
  products: PublicProduct[];
}

export function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null;

  const displayed = products.slice(0, 4);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <motion.div
            variants={sectionHeading}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Featured Pieces
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Handpicked pieces you&apos;ll love
            </p>
          </motion.div>

          <Link
            href="/products"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            View All
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {displayed.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            View All Products
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
