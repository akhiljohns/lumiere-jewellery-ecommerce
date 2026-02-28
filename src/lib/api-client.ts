import { CSRF_COOKIE_NAME } from "@/lib/csrf";

export function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match?.split("=")[1];
}

export async function fetchApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const csrfToken = getCsrfToken();
  const headers = new Headers(options?.headers);
  if (csrfToken) headers.set("x-csrf-token", csrfToken);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}
