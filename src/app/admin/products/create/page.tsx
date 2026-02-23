"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useCreateProduct } from "@/features/products/api/create-product";
import { ProductForm } from "@/features/products/components/product-form";

export default function CreateProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

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
