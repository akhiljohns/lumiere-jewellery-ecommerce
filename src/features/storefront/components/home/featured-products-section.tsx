"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "../product-card";
import { staggerContainer } from "../motion-variants";
import type { PublicProduct } from "@/features/storefront/types";

interface FeaturedProductsSectionProps {
  products: PublicProduct[];
}

export function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.6;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Featured Collection
            </h2>
            <p className="text-xs text-muted-foreground">
              Handpicked pieces you&apos;ll love
            </p>
          </div>
          <div className="hidden gap-1 sm:flex">
            <Button variant="outline" size="icon-sm" onClick={() => scroll("left")}>
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => scroll("right")}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        <motion.div
          ref={scrollRef}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          drag="x"
          dragConstraints={scrollRef}
        >
          {products.map((product) => (
            <div key={product.id} className="w-[200px] shrink-0 sm:w-[220px]">
              <ProductCard product={product} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
