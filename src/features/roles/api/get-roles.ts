import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PaginatedRoles } from "@/features/roles/types";
import { fetchApi } from "@/lib/api-client";

export const ROLES_QUERY_KEY = "roles";

async function fetchRoles(): Promise<PaginatedRoles> {
  return fetchApi<PaginatedRoles>("/api/admin/roles");
}

export function getRolesQueryOptions() {
  return queryOptions({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: fetchRoles,
  });
}

export function useGetRoles() {
  return useQuery(getRolesQueryOptions());
}
