"use client";

import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { DetailField } from "@/components/detail-field";
import { useGetCategory } from "@/features/categories/api/get-category";
import { useGetCategories } from "@/features/categories/api/get-categories";

export default function ViewCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetCategory(id);
  const { data: categoriesData } = useGetCategories({ limit: 100 });

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

  const parentName = category.parent_id
    ? categoriesData?.data?.find((c) => c.id === category.parent_id)?.name
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={category.name}
        subtitle="Category details"
        backUrl="/admin/categories"
        action={
          <Button
            size="lg"
            onClick={() => router.push(`/admin/categories/${id}/edit`)}
          >
            <Pencil />
            Edit Category
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Name" value={category.name} />
              <DetailField label="Slug" value={category.slug} />
              <DetailField
                label="Parent Category"
                value={parentName ?? "None (top-level)"}
              />
              <DetailField
                label="Status"
                value={
                  <Badge
                    variant={category.is_active ? "default" : "secondary"}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                }
              />
              <DetailField
                label="Sort Order"
                value={String(category.sort_order)}
              />
              <DetailField
                label="Created"
                value={new Date(category.created_at).toLocaleDateString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
          </CardHeader>
          <CardContent>
            {category.image_url ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted/30">
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No image set
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
