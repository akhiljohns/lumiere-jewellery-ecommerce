import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "../product-card-skeleton";

export function HomepageSkeleton() {
  return (
    <div>
      {/* Hero skeleton */}
      <Skeleton className="h-[60vh] w-full rounded-none" />

      {/* Featured products skeleton */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Skeleton className="mb-2 h-5 w-48" />
          <Skeleton className="mb-6 h-3 w-32" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[220px] shrink-0">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category grid skeleton */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="mb-6 h-3 w-56" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
