import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-lg border border-border p-4">
              <Skeleton className="size-24 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
