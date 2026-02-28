"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { useGetCategory } from "@/features/categories/api/get-category";
import { useUpdateCategory } from "@/features/categories/api/update-category";
import { CategoryForm } from "@/features/categories/components/category-form";
import type { CategoryCreateInput } from "@/lib/validators";

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetCategory(id);
  const updateCategory = useUpdateCategory();
  const { canEdit } = usePermissions();

  useEffect(() => {
    if (!canEdit("category")) {
      router.replace("/admin/categories");
    }
  }, [canEdit, router]);

  if (isLoading) return <PageLoader message="Loading category..." />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message || "Failed to load category"}
        backUrl="/admin/categories"
        backLabel="Back to Categories"
      />
    );
  }

  const category = data?.data;
  if (!category) return null;

  const defaultValues: Partial<CategoryCreateInput> = {
    name: category.name,
    parent_id: category.parent_id,
    image_url: category.image_url,
    sort_order: category.sort_order,
    is_active: category.is_active,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Category"
        subtitle={`Update ${category.name}`}
        backUrl={`/admin/categories/${id}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            defaultValues={defaultValues}
            submitLabel="Update Category"
            isSubmitting={updateCategory.isPending}
            excludeId={id}
            onSubmit={(formData) => {
              updateCategory.mutate(
                { id, data: formData },
                {
                  onSuccess: () => {
                    toast.success("Category updated successfully");
                    router.push(`/admin/categories/${id}`);
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
