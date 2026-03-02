import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductListingClient } from "@/features/storefront/components/listing/product-listing-client";
import { ProductGridSkeleton } from "@/features/storefront/components/listing/product-grid-skeleton";

export const metadata: Metadata = {
  title: "All Products — Lumière",
  description: "Browse our complete collection of handcrafted jewellery. Filter by category, material, and price.",
};

export default function ProductsPage() {
  return (
    <div>
      <div className="border-b border-border bg-card/50 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-lg font-semibold text-foreground">
            All Products
          </h1>
          <p className="text-xs text-muted-foreground">
            Explore our complete jewellery collection
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><ProductGridSkeleton /></div>}>
        <ProductListingClient />
      </Suspense>
    </div>
  );
}
