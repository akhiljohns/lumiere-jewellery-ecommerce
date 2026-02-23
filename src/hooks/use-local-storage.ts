"use client";

import { useCallback, useEffect, useState } from "react";

type SetValue<T> = T | ((val: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: SetValue<T>) => void] {
  // Always start with initialValue to match server render
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage after mount (client only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // Use initialValue if localStorage is unavailable
    }
    setHydrated(true);
  }, [key]);

  // Persist to localStorage whenever value changes (skip initial hydration sync)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [key, storedValue, hydrated]);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      setStoredValue((prev) =>
        typeof value === "function" ? (value as (val: T) => T)(prev) : value,
      );
    },
    [],
  );

  return [storedValue, setValue];
}
