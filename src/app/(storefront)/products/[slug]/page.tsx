import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getProductBySlug } from "@/features/storefront/services/storefront-service";
import { ProductBreadcrumbs } from "@/features/storefront/components/detail/product-breadcrumbs";
import { ProductDetailClient } from "@/features/storefront/components/detail/product-detail-client";
import { RelatedProducts } from "@/features/storefront/components/detail/related-products";
import { formatCurrency, getPrimaryImage } from "@/lib/utils";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result) {
    return { title: "Product Not Found — Lumière" };
  }

  const { product } = result;
  const primaryImage = getPrimaryImage(product.product_images);

  return {
    title: `${product.name} — Lumière`,
    description:
      product.description ??
      `Shop ${product.name} for ${formatCurrency(product.price)}. ${product.material ? `Made with ${product.material}.` : ""} Browse our handcrafted jewellery collection.`,
    openGraph: primaryImage
      ? { images: [{ url: primaryImage.url }] }
      : undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result) {
    notFound();
  }

  const { product, related } = result;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <ProductBreadcrumbs
          productName={product.name}
          category={product.categories}
        />
      </div>

      <ProductDetailClient product={product} />
      <RelatedProducts products={related} />
    </div>
  );
}
