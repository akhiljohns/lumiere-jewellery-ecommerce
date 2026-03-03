"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useGetRoles } from "@/features/roles/api/get-roles";
import { useDeleteRole } from "@/features/roles/api/delete-role";
import { getRoleQueryOptions } from "@/features/roles/api/get-role";
import { getRoleColumns } from "@/features/roles/components/role-columns";
import type { RoleWithPermissions } from "@/features/roles/types";
import { useAuthStore } from "@/stores/auth-store";

export default function RolesPage() {
  const [deleteTarget, setDeleteTarget] = useState<RoleWithPermissions | null>(null);
  const currentUserRole = useAuthStore((s) => s.user?.role);

  const queryClient = useQueryClient();
  const { data, isLoading } = useGetRoles();
  const deleteRole = useDeleteRole();

  const columns = useMemo(
    () =>
      getRoleColumns({
        canEdit: true,
        onDelete: (role) => setDeleteTarget(role),
        currentUserRole,
        onPrefetch: (id) => queryClient.prefetchQuery(getRoleQueryOptions(id)),
      }),
    [currentUserRole, queryClient],
  );

  const roles = data?.data ?? [];

  function handleDelete() {
    if (!deleteTarget) return;
    deleteRole.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Role "${deleteTarget.name}" deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Roles
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <Link href="/admin/roles/create" className={buttonVariants({ size: "lg" })}>
          <Plus />
          Add Role
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        pageCount={1}
        page={1}
        pageSize={roles.length || 10}
        total={roles.length}
        onPageChange={() => {}}
        isLoading={isLoading}
        getRowHref={(row) => `/admin/roles/${row.id}/edit`}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Role"
        description={`Are you sure you want to delete the "${deleteTarget?.name}" role? Users with this role will lose their permissions.`}
        onConfirm={handleDelete}
        loading={deleteRole.isPending}
        destructive
      />
    </div>
  );
}
