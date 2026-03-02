"use client";

import { motion } from "framer-motion";

import { CategoryCard } from "./category-card";
import { staggerContainer, sectionHeading } from "../motion-variants";
import type { CategoryWithCount } from "@/features/storefront/types";

interface CategoryGridSectionProps {
  categories: CategoryWithCount[];
}

export function CategoryGridSection({ categories }: CategoryGridSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={sectionHeading}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Find exactly what you&apos;re looking for
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
