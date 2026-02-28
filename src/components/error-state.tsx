import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

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
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <p className="text-sm text-destructive">{message}</p>
      <Link
        href={backUrl}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {backLabel}
      </Link>
    </div>
  );
}
