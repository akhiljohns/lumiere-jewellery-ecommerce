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
import { useGetProducts } from "@/features/products/api/get-products";
import { useDeleteProduct } from "@/features/products/api/delete-product";
import { getProductColumns } from "@/features/products/components/product-columns";
import { usePermissions } from "@/hooks/use-permissions";
import type { ProductWithImages } from "@/features/products/types";

export default function ProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    [],
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
        onView: (id) => router.push(`/admin/products/${id}`),
        onEdit: canEdit("product") ? (id) => router.push(`/admin/products/${id}/edit`) : undefined,
        onDelete: canDelete("product") ? (product) => setDeleteTarget(product) : undefined,
      }),
    [router, canEdit, canDelete],
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
          <Button size="lg" onClick={() => router.push("/admin/products/create")}>
            <Plus />
            Add Product
          </Button>
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
