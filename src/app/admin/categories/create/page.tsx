"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useCreateCategory } from "@/features/categories/api/create-category";
import { CategoryForm } from "@/features/categories/components/category-form";

export default function CreateCategoryPage() {
  const router = useRouter();
  const createCategory = useCreateCategory();
  const { canCreate } = usePermissions();

  useEffect(() => {
    if (!canCreate("category")) {
      router.replace("/admin");
    }
  }, [canCreate, router]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create Category"
        subtitle="Add a new product category"
        backUrl="/admin/categories"
      />

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            submitLabel="Create Category"
            isSubmitting={createCategory.isPending}
            onSubmit={(data) => {
              createCategory.mutate(data, {
                onSuccess: () => {
                  toast.success("Category created successfully");
                  router.push("/admin/categories");
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
