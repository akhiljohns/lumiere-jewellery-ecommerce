"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSkeleton } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { useGetProduct } from "@/features/products/api/get-product";
import { useUpdateProduct } from "@/features/products/api/update-product";
import type { ProductCreateInput } from "@/lib/validators";

const ProductForm = dynamic(
  () => import("@/features/products/components/product-form").then((m) => m.ProductForm),
  { ssr: false, loading: () => <FormSkeleton fields={8} /> },
);

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetProduct(id);
  const updateProduct = useUpdateProduct();
  const { canEdit } = usePermissions();

  useEffect(() => {
    if (!canEdit("product")) {
      router.replace("/admin/products");
    }
  }, [canEdit, router]);

  if (isLoading) return <FormSkeleton fields={8} />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message || "Failed to load product"}
        backUrl="/admin/products"
      />
    );
  }

  const product = data?.data;
  if (!product) return null;

  const defaultValues: Partial<ProductCreateInput> = {
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    compare_price: product.compare_price,
    category_id: product.category_id,
    material: product.material ?? "",
    weight: product.weight ?? "",
    stock: product.stock,
    is_active: product.is_active,
    images: product.product_images?.map((img) => ({
      url: img.url,
      public_id: img.public_id,
      is_primary: img.is_primary,
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Product"
        subtitle={`Update ${product.name}`}
        backUrl={`/admin/products/${id}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            defaultValues={defaultValues}
            submitLabel="Update Product"
            isSubmitting={updateProduct.isPending}
            onSubmit={(formData) => {
              updateProduct.mutate(
                { id, data: formData },
                {
                  onSuccess: () => {
                    toast.success("Product updated successfully");
                    router.push(`/admin/products/${id}`);
                  },
                  onError: (err) => {
                    toast.error(err.message);
                  },
                },
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
