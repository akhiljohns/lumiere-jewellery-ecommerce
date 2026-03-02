"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

interface ErrorBoundaryContentProps {
  error: Error & { digest?: string };
  reset: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ErrorBoundaryContent({
  error,
  reset,
  backHref,
  backLabel = "Go back",
}: ErrorBoundaryContentProps) {
  useEffect(() => {
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/60">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        {backHref && (
          <a href={backHref} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="size-4" />
            {backLabel}
          </a>
        )}
        <Button onClick={reset}>
          <RefreshCcw className="size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
