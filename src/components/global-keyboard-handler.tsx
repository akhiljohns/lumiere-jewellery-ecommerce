"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import { adminMenuItems } from "@/config/admin-menu";

export function GlobalKeyboardHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey) return;

      const match = e.code.match(/^Digit(\d)$/);
      if (!match) return;

      const index = parseInt(match[1], 10) - 1;
      const item = adminMenuItems[index];
      if (!item) return;

      e.preventDefault();

      if (pathname === item.href) return;

      router.push(item.href);
      toast.success(`Navigated to ${item.title}`, { duration: 2000 });
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);

  return null;
}
