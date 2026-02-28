"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSkeleton } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { useCreateProduct } from "@/features/products/api/create-product";

const ProductForm = dynamic(
  () => import("@/features/products/components/product-form").then((m) => m.ProductForm),
  { ssr: false, loading: () => <FormSkeleton /> },
);

export default function CreateProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { canCreate } = usePermissions();

  useEffect(() => {
    if (!canCreate("product")) {
      router.replace("/admin");
    }
  }, [canCreate, router]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create Product"
        subtitle="Add a new product to your store"
        backUrl="/admin/products"
      />

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            submitLabel="Create Product"
            isSubmitting={createProduct.isPending}
            onSubmit={(data) => {
              createProduct.mutate(data, {
                onSuccess: () => {
                  toast.success("Product created successfully");
                  router.push("/admin/products");
                },
                onError: (err) => {
                  toast.error(err.message);
                },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
