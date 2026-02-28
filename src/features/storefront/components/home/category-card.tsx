"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { staggerItem } from "../motion-variants";
import type { CategoryWithCount } from "@/features/storefront/types";

interface CategoryCardProps {
  category: CategoryWithCount;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <Link
        href={`/products?category=${category.slug}`}
        className="group relative block overflow-hidden rounded-lg border border-border"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {category.image_url ? (
            <CloudinaryImage
              src={category.image_url}
              alt={category.name}
              fill
              crop="fill"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-bold text-muted-foreground/30">
              {category.name.charAt(0)}
            </div>
          )}

          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="rounded-md bg-card/60 px-3 py-2 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-foreground">
                {category.name}
              </h3>
              <p className="text-[0.625rem] text-muted-foreground">
                {category.product_count}{" "}
                {category.product_count === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
