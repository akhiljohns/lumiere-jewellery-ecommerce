"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useGetRoles } from "@/features/roles/api/get-roles";
import { useDeleteRole } from "@/features/roles/api/delete-role";
import { getRoleColumns } from "@/features/roles/components/role-columns";
import type { RoleWithPermissions } from "@/features/roles/types";

export default function RolesPage() {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<RoleWithPermissions | null>(null);

  const { data, isLoading } = useGetRoles();
  const deleteRole = useDeleteRole();

  const columns = useMemo(
    () =>
      getRoleColumns({
        onEdit: (id) => router.push(`/admin/roles/${id}/edit`),
        onDelete: (role) => setDeleteTarget(role),
      }),
    [router],
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
        <Button size="lg" onClick={() => router.push("/admin/roles/create")}>
          <Plus />
          Add Role
        </Button>
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
