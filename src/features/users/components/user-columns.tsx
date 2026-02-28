"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SafeUser } from "@/features/users/types";

interface ColumnActions {
  canEdit?: boolean;
  onDelete?: (user: SafeUser) => void;
  onPrefetch?: (id: string) => void;
}

export function getUserColumns(
  actions: ColumnActions,
): ColumnDef<SafeUser>[] {
  return [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.full_name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === "admin" ? "default" : "secondary"}
        >
          {row.original.role}
        </Badge>
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
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div
            className="flex items-center gap-3"
            onMouseEnter={() => actions.onPrefetch?.(user.id)}
          >
            <Tooltip>
              <TooltipTrigger
                render={<Link href={`/admin/users/${user.id}`} />}
              >
                <Eye className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
              </TooltipTrigger>
              <TooltipContent side="top">View user</TooltipContent>
            </Tooltip>
            {actions.canEdit && (
              <Tooltip>
                <TooltipTrigger
                  render={<Link href={`/admin/users/${user.id}/edit`} />}
                >
                  <Pencil className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Edit user</TooltipContent>
              </Tooltip>
            )}
            {actions.onDelete && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => actions.onDelete!(user)}
                    />
                  }
                >
                  <Trash2 className="size-[18px] text-destructive/60 cursor-pointer hover:text-destructive hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Delete user</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];
}
