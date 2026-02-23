"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  backUrl?: string;
  backLabel?: string;
}

export function ErrorState({
  message = "Something went wrong",
  backUrl = "/admin/products",
  backLabel = "Back to Products",
}: ErrorStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <p className="text-sm text-destructive">{message}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(backUrl)}
      >
        {backLabel}
      </Button>
    </div>
  );
}
