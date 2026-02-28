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
import { useGetCategory } from "@/features/categories/api/get-category";
import { useUpdateCategory } from "@/features/categories/api/update-category";
import type { CategoryCreateInput } from "@/lib/validators";

const CategoryForm = dynamic(
  () => import("@/features/categories/components/category-form").then((m) => m.CategoryForm),
  { ssr: false, loading: () => <FormSkeleton fields={4} /> },
);

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

  if (isLoading) return <FormSkeleton fields={4} />;

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
