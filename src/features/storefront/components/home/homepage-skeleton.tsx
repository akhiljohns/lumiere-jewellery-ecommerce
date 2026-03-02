import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "../product-card-skeleton";

export function HomepageSkeleton() {
  return (
    <div>
      {/* Hero skeleton — 2 columns */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4 text-center lg:text-left">
            <Skeleton className="mx-auto h-6 w-32 rounded-full lg:mx-0" />
            <Skeleton className="mx-auto h-12 w-80 lg:mx-0" />
            <Skeleton className="mx-auto h-12 w-64 lg:mx-0" />
            <Skeleton className="mx-auto h-5 w-72 lg:mx-0" />
            <div className="flex justify-center gap-3 lg:justify-start">
              <Skeleton className="h-11 w-40 rounded-md" />
              <Skeleton className="h-11 w-28 rounded-md" />
            </div>
          </div>
          <Skeleton className="mx-auto aspect-[4/5] w-full max-w-md rounded-2xl" />
        </div>
      </section>

      {/* Features strip skeleton */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products skeleton */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="mb-8 h-4 w-56" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Category grid skeleton */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Skeleton className="mb-2 h-7 w-40" />
          <Skeleton className="mb-8 h-4 w-56" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter skeleton */}
      <section className="bg-card py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <Skeleton className="mx-auto h-8 w-72" />
          <Skeleton className="mx-auto mt-3 h-4 w-80" />
          <div className="mt-6 flex justify-center gap-3">
            <Skeleton className="h-10 w-64 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
      </section>
    </div>
  );
}
