"use client";

import { useLayoutEffect } from "react";
import { useLocalStorage } from "./use-local-storage";

export function useColorMode() {
  const [colorMode, setColorMode] = useLocalStorage<"light" | "dark">(
    "color-theme",
    "light",
  );

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    if (colorMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [colorMode]);

  return [colorMode, setColorMode] as const;
}
