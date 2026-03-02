"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div role="status" aria-label={message} className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** Skeleton for edit pages that show a card with a form */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div role="status" aria-label="Loading form" className="flex flex-col gap-6">
      {/* Page header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-full rounded-md" />
            </div>
          ))}
          <div className="flex justify-end">
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Skeleton for detail/view pages with info fields in a card grid */
export function DetailSkeleton({
  fields = 6,
  hasSidebar = false,
}: {
  fields?: number;
  hasSidebar?: boolean;
}) {
  return (
    <div role="status" aria-label="Loading details" className="flex flex-col gap-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className={hasSidebar ? "grid gap-6 lg:grid-cols-3" : ""}>
        <Card className={hasSidebar ? "lg:col-span-2" : ""}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {hasSidebar && (
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-square w-full rounded-lg" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading table data" className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="rounded-md border">
        <div className="border-b px-4 py-3">
          <div className="flex gap-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 last:border-0">
            <div className="flex gap-8">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-20" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </div>
  );
}
