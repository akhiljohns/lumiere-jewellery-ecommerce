import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
