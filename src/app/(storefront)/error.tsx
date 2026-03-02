"use client";

import { ErrorBoundaryContent } from "@/components/error-boundary-content";

export default function StorefrontError({
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
      backHref="/"
      backLabel="Back to Home"
    />
  );
}
