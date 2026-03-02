import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filter sidebar skeleton */}
        <div className="hidden lg:block">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-32" />
            ))}
            <Skeleton className="h-5 w-24 mt-6" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        {/* Product grid skeleton */}
        <div className="lg:col-span-3">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
