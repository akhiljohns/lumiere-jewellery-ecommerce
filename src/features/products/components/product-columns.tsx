"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, getPrimaryImage } from "@/lib/utils";
import type { ProductWithImages } from "@/features/products/types";

interface ColumnActions {
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (product: ProductWithImages) => void;
}

export function getProductColumns(
  actions: ColumnActions,
): ColumnDef<ProductWithImages>[] {
  return [
    {
      accessorKey: "product_images",
      header: "Image",
      cell: ({ row }) => {
        const primary = getPrimaryImage(row.original.product_images);
        return primary ? (
          <Image
            src={primary.url}
            alt={row.original.name}
            width={44}
            height={44}
            className="size-11 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-11 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            N/A
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.name}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.categories?.name ?? "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.original.stock;
        return (
          <span
            className={`tabular-nums ${stock === 0 ? "text-destructive font-semibold" : ""}`}
          >
            {stock}
          </span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Active" : "Draft"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => actions.onView(product.id)}
                  />
                }
              >
                <Eye className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
              </TooltipTrigger>
              <TooltipContent side="top">View product</TooltipContent>
            </Tooltip>
            {actions.onEdit && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => actions.onEdit!(product.id)}
                    />
                  }
                >
                  <Pencil className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Edit product</TooltipContent>
              </Tooltip>
            )}
            {actions.onDelete && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => actions.onDelete!(product)}
                    />
                  }
                >
                  <Trash2 className="size-[18px] text-destructive/60 cursor-pointer hover:text-destructive hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Delete product</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];
}
