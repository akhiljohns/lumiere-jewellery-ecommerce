"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      try {
        await fetchApi("/api/auth/customer-logout", { method: "POST" });
      } catch {
        // Ignore errors — still redirect
      }
      router.push("/");
      router.refresh();
    }
    performLogout();
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
