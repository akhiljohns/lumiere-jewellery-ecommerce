"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { CloudinaryImage } from "@/components/cloudinary-image";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DetailSkeleton } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { DetailField } from "@/components/detail-field";
import { useGetProduct } from "@/features/products/api/get-product";
import { formatCurrency } from "@/lib/utils";

export default function ViewProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useGetProduct(id);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (isLoading) return <DetailSkeleton fields={10} hasSidebar />;

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

  const images = product.product_images ?? [];
  const selectedImage = images[selectedIndex] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={product.name}
        subtitle="Product details"
        backUrl="/admin/products"
        action={
          <Link href={`/admin/products/${id}/edit`} className={buttonVariants({ size: "lg" })}>
            <Pencil />
            Edit Product
          </Link>
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
              <DetailField label="Category" value={product.categories?.name ?? "—"} />
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
              {images.length} image(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {images.length ? (
              <div className="space-y-3">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted/30">
                  {selectedImage && (
                    <CloudinaryImage
                      src={selectedImage.url}
                      alt={product.name}
                      fill
                      crop="fill"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-opacity duration-200"
                      key={selectedImage.id}
                    />
                  )}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-md"
                        onClick={() =>
                          setSelectedIndex((i) =>
                            i === 0 ? images.length - 1 : i - 1,
                          )
                        }
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-md"
                        onClick={() =>
                          setSelectedIndex((i) =>
                            i === images.length - 1 ? 0 : i + 1,
                          )
                        }
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/70 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-xs tabular-nums text-foreground/80">
                        {selectedIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, index) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`relative size-16 overflow-hidden rounded-md border-2 transition-all hover:opacity-100 ${
                          index === selectedIndex
                            ? "border-primary ring-1 ring-primary/30 opacity-100"
                            : "border-transparent opacity-60 hover:border-border"
                        }`}
                      >
                        <CloudinaryImage
                          src={img.url}
                          alt={`Product image ${index + 1}`}
                          width={64}
                          height={64}
                          crop="fill"
                          className="object-cover"
                        />
                      </button>
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
