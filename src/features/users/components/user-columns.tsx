"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SafeUser } from "@/features/users/types";

interface ColumnActions {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (user: SafeUser) => void;
}

export function getUserColumns(
  actions: ColumnActions,
): ColumnDef<SafeUser>[] {
  return [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {row.original.full_name || "—"}
          </span>
        </div>
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
        <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onView(user.id)}
              title="View"
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onEdit(user.id)}
              title="Edit"
            >
              <Pencil />
            </Button>
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={() => actions.onDelete(user)}
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
