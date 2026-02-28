"use client";

import { useState, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useGetStorefrontProducts } from "@/features/storefront/api/get-storefront-products";
import { useProductFilters } from "./use-product-filters";
import { FilterSidebar } from "./filter-sidebar";
import { SortControls } from "./sort-controls";
import { ProductGrid } from "./product-grid";
import { ProductGridSkeleton } from "./product-grid-skeleton";
import { PaginationControls } from "./pagination-controls";
import { QuickViewModal } from "./quick-view-modal";
import type { PublicProduct } from "@/features/storefront/types";

export function ProductListingClient() {
  const { filters, setFilter, setFilters, resetFilters } = useProductFilters();
  const [quickViewProduct, setQuickViewProduct] =
    useState<PublicProduct | null>(null);

  const { data, isLoading } = useGetStorefrontProducts({
    page: filters.page,
    sort: filters.sort,
    order: filters.order as "asc" | "desc",
    category_slug: filters.category ?? undefined,
    material: filters.material ?? undefined,
    min_price: filters.min_price ?? undefined,
    max_price: filters.max_price ?? undefined,
    search: filters.search ?? undefined,
    limit: 12,
  });

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback(
    (key: string, value: string | number | null) => {
      setFilter(key as "category", value as string | null);
    },
    [setFilter],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <FilterSidebar
            filters={{
              category: filters.category,
              material: filters.material,
              min_price: filters.min_price,
              max_price: filters.max_price,
            }}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
          />
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-2">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="size-3.5" />
                    Filters
                  </Button>
                }
              />
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-6 py-4">
                  <FilterSidebar
                    filters={{
                      category: filters.category,
                      material: filters.material,
                      min_price: filters.min_price,
                      max_price: filters.max_price,
                    }}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1">
              <SortControls
                sort={filters.sort}
                order={filters.order}
                total={pagination?.total ?? 0}
                onSortChange={(sort, order) =>
                  setFilters({ sort, order, page: 1 })
                }
              />
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton />
          ) : (
            <ProductGrid
              products={products}
              onQuickView={setQuickViewProduct}
            />
          )}

          {pagination && (
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setFilter("page", page)}
            />
          )}
        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
