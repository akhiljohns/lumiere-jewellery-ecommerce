"use client";

import { motion } from "framer-motion";

import { CategoryCard } from "./category-card";
import { staggerContainer } from "../motion-variants";
import type { CategoryWithCount } from "@/features/storefront/types";

interface CategoryGridSectionProps {
  categories: CategoryWithCount[];
}

export function CategoryGridSection({ categories }: CategoryGridSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Shop by Category
          </h2>
          <p className="text-xs text-muted-foreground">
            Find exactly what you&apos;re looking for
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
