"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PermissionGuard } from "@/components/permission-guard";
import { useGetCategories } from "@/features/categories/api/get-categories";
import { useDeleteCategory } from "@/features/categories/api/delete-category";
import { getCategoryQueryOptions } from "@/features/categories/api/get-category";
import { getCategoryColumns } from "@/features/categories/components/category-columns";
import { usePermissions } from "@/hooks/use-permissions";
import type { Category } from "@/lib/supabase/types";

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data, isLoading } = useGetCategories({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    sort: "sort_order",
    order: "asc",
  });

  const queryClient = useQueryClient();
  const deleteCategory = useDeleteCategory();
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
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`"${deleteTarget.name}" deleted successfully`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }, [deleteTarget, deleteCategory]);

  const categories = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const parentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories) {
      map[cat.id] = cat.name;
    }
    return map;
  }, [categories]);

  const columns = useMemo(
    () =>
      getCategoryColumns({
        canEdit: canEdit("category"),
        onDelete: canDelete("category")
          ? (category) => setDeleteTarget(category)
          : undefined,
        parentNameMap,
        onPrefetch: (id) => queryClient.prefetchQuery(getCategoryQueryOptions(id)),
      }),
    [canEdit, canDelete, parentNameMap, queryClient],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your product categories
          </p>
        </div>
        <PermissionGuard permission="category.create">
          <Link href="/admin/categories/create" className={buttonVariants({ size: "lg" })}>
            <Plus />
            Add Category
          </Link>
        </PermissionGuard>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={categories}
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
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Products in this category will become uncategorised.`}
        onConfirm={handleDelete}
        loading={deleteCategory.isPending}
        destructive
      />
    </div>
  );
}
