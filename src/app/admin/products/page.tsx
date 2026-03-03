"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PermissionGuard } from "@/components/permission-guard";
import { useGetProducts } from "@/features/products/api/get-products";
import { useDeleteProduct } from "@/features/products/api/delete-product";
import { getProductQueryOptions } from "@/features/products/api/get-product";
import { getProductColumns } from "@/features/products/components/product-columns";
import { usePermissions } from "@/hooks/use-permissions";
import type { ProductWithImages } from "@/features/products/types";

export default function ProductsPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithImages | null>(
    null,
  );

  const { data, isLoading } = useGetProducts({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    sort: "created_at",
    order: "desc",
  });

  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();
  const { canEdit, canDelete } = usePermissions();

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      return () => clearTimeout(timeout);
    },
    [setSearch, setPage],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteProduct.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`"${deleteTarget.name}" deleted successfully`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }, [deleteTarget, deleteProduct]);

  const columns = useMemo(
    () =>
      getProductColumns({
        canEdit: canEdit("product"),
        onDelete: canDelete("product") ? (product) => setDeleteTarget(product) : undefined,
        onPrefetch: (id) => queryClient.prefetchQuery(getProductQueryOptions(id)),
      }),
    [canEdit, canDelete, queryClient],
  );

  const products = data?.data ?? [];
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
            Products
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your jewellery products
          </p>
        </div>
        <PermissionGuard permission="product.create">
          <Link href="/admin/products/create" className={buttonVariants({ size: "lg" })}>
            <Plus />
            Add Product
          </Link>
        </PermissionGuard>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={products}
        pageCount={pagination.totalPages}
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={setPage}
        isLoading={isLoading}
        getRowHref={(row) => `/admin/products/${row.id}/edit`}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteProduct.isPending}
        destructive
      />
    </div>
  );
}
