"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getPrimaryImage } from "@/lib/utils";
import type { ProductWithImages } from "@/features/products/types";

interface ColumnActions {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (product: ProductWithImages) => void;
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
            width={40}
            height={40}
            className="size-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            N/A
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.original.stock;
        return (
          <span className={stock === 0 ? "text-destructive font-medium" : ""}>
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onView(product.id)}
              title="View"
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onEdit(product.id)}
              title="Edit"
            >
              <Pencil />
            </Button>
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={() => actions.onDelete(product)}
              title="Delete"
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    },
  ];
}
