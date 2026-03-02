"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { staggerItem, cardHover } from "../motion-variants";
import type { CategoryWithCount } from "@/features/storefront/types";

interface CategoryCardProps {
  category: CategoryWithCount;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <motion.div variants={staggerItem} {...cardHover}>
      <Link
        href={`/products?category=${category.slug}`}
        className="group relative block overflow-hidden rounded-lg"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {category.image_url ? (
            <CloudinaryImage
              src={category.image_url}
              alt={category.name}
              fill
              crop="fill"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-bold text-muted-foreground/30">
              {category.name.charAt(0)}
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-display text-lg font-bold text-foreground">
              {category.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {category.product_count}{" "}
              {category.product_count === 1 ? "product" : "products"}
            </p>
            <span className="mt-1.5 inline-block text-xs font-medium text-primary">
              Shop now &rarr;
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
