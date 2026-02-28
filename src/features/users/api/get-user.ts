import { queryOptions, useQuery } from "@tanstack/react-query";
import type { SafeUser } from "@/features/users/types";
import { fetchApi } from "@/lib/api-client";
import { adminUser } from "@/lib/api-routes";

export const USER_QUERY_KEY = "user";

async function fetchUser(id: string): Promise<{ data: SafeUser }> {
  return fetchApi<{ data: SafeUser }>(adminUser(id));
}

export function getUserQueryOptions(id: string) {
  return queryOptions({
    queryKey: [USER_QUERY_KEY, id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useGetUser(id: string) {
  return useQuery(getUserQueryOptions(id));
}
