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
import type { Category } from "@/lib/supabase/types";

interface ColumnActions {
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (category: Category) => void;
  parentNameMap?: Record<string, string>;
}

export function getCategoryColumns(
  actions: ColumnActions,
): ColumnDef<Category>[] {
  return [
    {
      accessorKey: "image_url",
      header: "Image",
      cell: ({ row }) => {
        const url = row.original.image_url;
        return url ? (
          <Image
            src={url}
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
        <div>
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
          <p className="text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    },
    {
      id: "parent",
      header: "Parent",
      cell: ({ row }) => {
        const parentId = row.original.parent_id;
        if (!parentId) return <span className="text-muted-foreground">—</span>;
        const name = actions.parentNameMap?.[parentId];
        return (
          <Badge variant="secondary">{name ?? "Unknown"}</Badge>
        );
      },
    },
    {
      accessorKey: "sort_order",
      header: "Sort",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.sort_order}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => actions.onView(category.id)}
                  />
                }
              >
                <Eye className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
              </TooltipTrigger>
              <TooltipContent side="top">View category</TooltipContent>
            </Tooltip>
            {actions.onEdit && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => actions.onEdit!(category.id)}
                    />
                  }
                >
                  <Pencil className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Edit category</TooltipContent>
              </Tooltip>
            )}
            {actions.onDelete && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => actions.onDelete!(category)}
                    />
                  }
                >
                  <Trash2 className="size-[18px] text-destructive/60 cursor-pointer hover:text-destructive hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Delete category</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];
}
