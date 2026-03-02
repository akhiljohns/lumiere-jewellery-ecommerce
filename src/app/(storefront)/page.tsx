import type { Metadata } from "next";

import { getFeaturedProducts, getPublicCategories } from "@/features/storefront/services/storefront-service";
import { HeroSection } from "@/features/storefront/components/home/hero-section";
import { FeaturesStrip } from "@/features/storefront/components/home/features-strip";
import { FeaturedProductsSection } from "@/features/storefront/components/home/featured-products-section";
import { CategoryGridSection } from "@/features/storefront/components/home/category-grid-section";
import { NewsletterSection } from "@/features/storefront/components/home/newsletter-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lumière — Exquisite Handcrafted Jewellery",
  description:
    "Discover timeless handcrafted jewellery designs. Shop our curated collection of rings, necklaces, earrings, and bracelets.",
};

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(8),
    getPublicCategories(),
  ]);

  return (
    <>
      <HeroSection heroImageUrl="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=90" />
      <FeaturesStrip />
      <FeaturedProductsSection products={featuredProducts} />
      <CategoryGridSection categories={categories} />
      <NewsletterSection />
    </>
  );
}
