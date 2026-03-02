"use client";

import { ErrorBoundaryContent } from "@/components/error-boundary-content";

export default function ProductsError({
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
      backHref="/admin/products"
      backLabel="Back to Products"
    />
  );
}
