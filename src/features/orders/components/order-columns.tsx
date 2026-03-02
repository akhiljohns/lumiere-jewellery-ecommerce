"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import type { OrderWithItems } from "@/features/orders/types";

interface ColumnActions {
  onPrefetch?: (id: string) => void;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

const paymentVariant: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  failed: "destructive",
  refunded: "destructive",
};

export function getOrderColumns(
  actions: ColumnActions,
): ColumnDef<OrderWithItems>[] {
  return [
    {
      accessorKey: "order_number",
      header: "Order #",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          #{row.original.order_number}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const user = row.original.users;
        return (
          <div>
            <span className="text-sm text-foreground">
              {user?.full_name || user?.email || "—"}
            </span>
            {user?.full_name && user?.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.original.total)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ row }) => (
        <Badge variant={paymentVariant[row.original.payment_status] ?? "secondary"}>
          {row.original.payment_status}
        </Badge>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Method",
      cell: ({ row }) => (
        <span className="text-sm uppercase text-muted-foreground">
          {row.original.payment_method}
        </span>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.order_items.length}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div
            className="flex items-center gap-3"
            onMouseEnter={() => actions.onPrefetch?.(order.id)}
          >
            <Tooltip>
              <TooltipTrigger
                render={<Link href={`/admin/orders/${order.id}`} />}
              >
                <Eye className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
              </TooltipTrigger>
              <TooltipContent side="top">View order</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}
