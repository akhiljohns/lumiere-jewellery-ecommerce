import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[380px] w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px] w-full rounded-lg" />
        <Skeleton className="h-[380px] w-full rounded-lg" />
      </div>
    </div>
  );
}
