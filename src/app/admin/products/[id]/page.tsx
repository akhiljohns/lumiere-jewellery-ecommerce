"use client";

import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { DetailField } from "@/components/detail-field";
import { useGetProduct } from "@/features/products/api/get-product";
import { formatCurrency, getPrimaryImage } from "@/lib/utils";

export default function ViewProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetProduct(id);

  if (isLoading) return <PageLoader message="Loading product..." />;

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

  const primaryImage = getPrimaryImage(product.product_images);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={product.name}
        subtitle="Product details"
        backUrl="/admin/products"
        action={
          <Button
            size="lg"
            onClick={() => router.push(`/admin/products/${id}/edit`)}
          >
            <Pencil />
            Edit Product
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Name" value={product.name} />
              <DetailField label="Slug" value={product.slug} />
              <DetailField label="Category" value={product.category} />
              <DetailField
                label="Status"
                value={
                  <Badge
                    variant={product.is_active ? "default" : "secondary"}
                  >
                    {product.is_active ? "Active" : "Draft"}
                  </Badge>
                }
              />
              <DetailField label="Price" value={formatCurrency(product.price)} />
              <DetailField
                label="Compare Price"
                value={
                  product.compare_price
                    ? formatCurrency(product.compare_price)
                    : "—"
                }
              />
              <DetailField label="Stock" value={String(product.stock)} />
              <DetailField label="Material" value={product.material || "—"} />
              <DetailField label="Weight" value={product.weight || "—"} />
              <DetailField
                label="Created"
                value={new Date(product.created_at).toLocaleDateString()}
              />
            </div>

            {product.description && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              {product.product_images?.length || 0} image(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {product.product_images?.length ? (
              <div className="space-y-3">
                {primaryImage && (
                  <div className="relative aspect-square w-full overflow-hidden rounded-md border">
                    <Image
                      src={primaryImage.url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                {product.product_images.length > 1 && (
                  <div className="flex flex-wrap gap-3">
                    {product.product_images.map((img) => (
                      <div
                        key={img.id}
                        className={`relative size-16 overflow-hidden rounded-md border ${
                          img.is_primary ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt="Product"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No images uploaded
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
