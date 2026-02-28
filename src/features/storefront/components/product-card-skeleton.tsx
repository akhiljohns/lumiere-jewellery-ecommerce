import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="flex h-24 flex-col justify-between p-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
