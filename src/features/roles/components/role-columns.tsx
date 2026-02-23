"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RoleWithPermissions } from "@/features/roles/types";

interface ColumnActions {
  onEdit?: (id: string) => void;
  onDelete?: (role: RoleWithPermissions) => void;
}

export function getRoleColumns(
  actions: ColumnActions,
): ColumnDef<RoleWithPermissions>[] {
  return [
    {
      accessorKey: "name",
      header: "Role",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground font-mono">
            {row.original.name}
          </span>
          {row.original.is_system && (
            <Tooltip>
              <TooltipTrigger>
                <ShieldCheck className="size-3.5 text-primary" />
              </TooltipTrigger>
              <TooltipContent side="top">System role (protected)</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const perms = row.original.permissions;
        const shown = perms.slice(0, 3);
        const rest = perms.length - shown.length;
        return (
          <div className="flex flex-wrap gap-1">
            {shown.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs font-mono">
                {p}
              </Badge>
            ))}
            {rest > 0 && (
              <Badge variant="outline" className="text-xs">
                +{rest} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-3">
            {actions.onEdit && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => actions.onEdit!(role.id)}
                    />
                  }
                >
                  <Pencil className="size-[18px] text-muted-foreground cursor-pointer hover:text-foreground hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Edit role</TooltipContent>
              </Tooltip>
            )}
            {actions.onDelete && !role.is_system && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => actions.onDelete!(role)}
                    />
                  }
                >
                  <Trash2 className="size-[18px] text-destructive/60 cursor-pointer hover:text-destructive hover:scale-110 transition-all duration-200" />
                </TooltipTrigger>
                <TooltipContent side="top">Delete role</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];
}
