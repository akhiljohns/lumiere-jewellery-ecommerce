"use client";

import { ErrorBoundaryContent } from "@/components/error-boundary-content";

export default function UsersError({
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
      backHref="/admin/users"
      backLabel="Back to Users"
    />
  );
}
