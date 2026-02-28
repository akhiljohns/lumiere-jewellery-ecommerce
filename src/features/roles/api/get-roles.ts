import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PaginatedRoles } from "@/features/roles/types";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_ROLES } from "@/lib/api-routes";

export const ROLES_QUERY_KEY = "roles";

async function fetchRoles(): Promise<PaginatedRoles> {
  return fetchApi<PaginatedRoles>(ADMIN_ROLES);
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
