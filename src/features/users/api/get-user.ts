import { queryOptions, useQuery } from "@tanstack/react-query";
import type { SafeUser } from "@/features/users/types";
import { fetchApi } from "@/lib/api-client";

export const USER_QUERY_KEY = "user";

async function fetchUser(id: string): Promise<{ data: SafeUser }> {
  return fetchApi<{ data: SafeUser }>(`/api/admin/users/${id}`);
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
