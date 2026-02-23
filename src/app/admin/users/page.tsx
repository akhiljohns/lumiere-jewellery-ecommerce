"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PermissionGuard } from "@/components/permission-guard";
import { useGetUsers } from "@/features/users/api/get-users";
import { useDeleteUser } from "@/features/users/api/delete-user";
import { getUserColumns } from "@/features/users/components/user-columns";
import { usePermissions } from "@/hooks/use-permissions";
import type { SafeUser } from "@/features/users/types";

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SafeUser | null>(null);

  const { data, isLoading } = useGetUsers({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    sort: "created_at",
    order: "desc",
  });

  const deleteUser = useDeleteUser();
  const { canEdit, canDelete } = usePermissions();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(
          `"${deleteTarget.full_name || deleteTarget.email}" deleted successfully`,
        );
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }, [deleteTarget, deleteUser]);

  const columns = useMemo(
    () =>
      getUserColumns({
        onView: (id) => router.push(`/admin/users/${id}`),
        onEdit: canEdit("user") ? (id) => router.push(`/admin/users/${id}/edit`) : undefined,
        onDelete: canDelete("user") ? (user) => setDeleteTarget(user) : undefined,
      }),
    [router, canEdit, canDelete],
  );

  const users = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts
          </p>
        </div>
        <PermissionGuard permission="user.create">
          <Button size="lg" onClick={() => router.push("/admin/users/create")}>
            <Plus />
            Add User
          </Button>
        </PermissionGuard>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        pageCount={pagination.totalPages}
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteTarget?.full_name || deleteTarget?.email}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteUser.isPending}
        destructive
      />
    </div>
  );
}
