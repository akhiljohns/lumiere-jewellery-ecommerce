"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@/features/audit/types";

const actionIcons: Record<string, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
};

const actionVariant: Record<string, "default" | "secondary" | "destructive"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
};

export function getAuditLogColumns(): ColumnDef<AuditLog>[] {
  return [
    {
      accessorKey: "created_at",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.original.created_at).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.original.action;
        const Icon = actionIcons[action] ?? Pencil;
        return (
          <Badge variant={actionVariant[action] ?? "secondary"}>
            <Icon className="mr-1 size-3" />
            {action}
          </Badge>
        );
      },
    },
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {row.original.resource}
        </span>
      ),
    },
    {
      id: "identifier",
      header: "Details",
      cell: ({ row }) => {
        const details = row.original.details as Record<string, unknown> | null;
        const identifier = details?.identifier as string | undefined;
        return (
          <div className="max-w-[200px]">
            <span className="text-sm text-foreground truncate block">
              {identifier || row.original.resource_id || "—"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "actor_email",
      header: "Actor",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.actor_email}
        </span>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.original.ip_address || "—"}
        </span>
      ),
    },
  ];
}
