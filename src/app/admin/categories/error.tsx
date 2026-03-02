"use client";

import { ErrorBoundaryContent } from "@/components/error-boundary-content";

export default function CategoriesError({
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
      backHref="/admin/categories"
      backLabel="Back to Categories"
    />
  );
}
