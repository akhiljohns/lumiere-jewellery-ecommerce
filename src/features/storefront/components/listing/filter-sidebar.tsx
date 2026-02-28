"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useGetPublicCategories } from "@/features/storefront/api/get-public-categories";
import { cn } from "@/lib/utils";

interface FilterValues {
  category: string | null;
  material: string | null;
  min_price: number | null;
  max_price: number | null;
}

interface FilterSidebarProps {
  filters: FilterValues;
  onFilterChange: (key: keyof FilterValues, value: string | number | null) => void;
  onReset: () => void;
}

const materials = [
  "Gold",
  "Silver",
  "Platinum",
  "Diamond",
  "Pearl",
  "Rose Gold",
];

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
}: FilterSidebarProps) {
  const { data } = useGetPublicCategories();
  const categories = data?.data ?? [];

  const hasActiveFilters =
    filters.category || filters.material || filters.min_price || filters.max_price;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="xs" onClick={onReset}>
            <X className="size-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-foreground">Category</h4>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange(
                    "category",
                    filters.category === cat.slug ? null : cat.slug,
                  )
                }
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted",
                  filters.category === cat.slug
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <span>{cat.name}</span>
                <span className="text-[0.625rem]">{cat.product_count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Material */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-foreground">Material</h4>
        <div className="flex flex-wrap gap-1.5">
          {materials.map((mat) => (
            <button
              key={mat}
              type="button"
              onClick={() =>
                onFilterChange(
                  "material",
                  filters.material === mat ? null : mat,
                )
              }
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.625rem] transition-colors",
                filters.material === mat
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {mat}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-foreground">Price Range</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.min_price ?? ""}
            onChange={(e) =>
              onFilterChange(
                "min_price",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="h-7 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.max_price ?? ""}
            onChange={(e) =>
              onFilterChange(
                "max_price",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
