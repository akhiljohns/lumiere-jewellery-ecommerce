import { Suspense } from "react";
import type { Metadata } from "next";
import { Gem } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In | Jewellery Admin",
  description: "Sign in to the jewellery store admin panel",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gem className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Jewellery Admin
          </span>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
