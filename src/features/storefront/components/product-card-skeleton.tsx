import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="p-3">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="mt-1.5 h-4 w-3/4" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
      <div className="px-3 pb-3">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
