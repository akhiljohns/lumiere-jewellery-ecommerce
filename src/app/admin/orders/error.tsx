"use client";

import { ErrorBoundaryContent } from "@/components/error-boundary-content";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryContent
      error={error}
      reset={reset}
      backHref="/admin/orders"
      backLabel="Back to Orders"
    />
  );
}
