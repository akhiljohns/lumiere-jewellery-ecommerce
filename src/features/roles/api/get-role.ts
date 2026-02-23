import { queryOptions, useQuery } from "@tanstack/react-query";
import type { RoleWithPermissions } from "@/features/roles/types";
import { fetchApi } from "@/lib/api-client";

export const ROLE_QUERY_KEY = "role";

async function fetchRole(id: string): Promise<{ data: RoleWithPermissions }> {
  return fetchApi<{ data: RoleWithPermissions }>(`/api/admin/roles/${id}`);
}

export function getRoleQueryOptions(id: string) {
  return queryOptions({
    queryKey: [ROLE_QUERY_KEY, id],
    queryFn: () => fetchRole(id),
    enabled: !!id,
  });
}

export function useGetRole(id: string) {
  return useQuery(getRoleQueryOptions(id));
}
