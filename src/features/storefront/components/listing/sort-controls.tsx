"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortControlsProps {
  sort: string;
  order: string;
  total: number;
  onSortChange: (sort: string, order: string) => void;
}

const sortOptions = [
  { label: "Newest", value: "created_at:desc" },
  { label: "Price: Low to High", value: "price:asc" },
  { label: "Price: High to Low", value: "price:desc" },
  { label: "Name: A to Z", value: "name:asc" },
];

export function SortControls({
  sort,
  order,
  total,
  onSortChange,
}: SortControlsProps) {
  const currentValue = `${sort}:${order}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
      <p className="text-xs text-muted-foreground">
        {total} {total === 1 ? "product" : "products"}
      </p>

      <Select
        value={currentValue}
        onValueChange={(val) => {
          if (!val) return;
          const [newSort, newOrder] = val.split(":");
          onSortChange(newSort, newOrder);
        }}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
