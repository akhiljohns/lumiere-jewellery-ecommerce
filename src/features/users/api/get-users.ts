import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PaginatedUsers, UserQueryParams } from "@/features/users/types";
import { fetchApi } from "@/lib/api-client";

export const USERS_QUERY_KEY = "users";

async function fetchUsers(params: UserQueryParams): Promise<PaginatedUsers> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.verified) searchParams.set("verified", params.verified);

  return fetchApi<PaginatedUsers>(`/api/admin/users?${searchParams}`);
}

export function getUsersQueryOptions(params: UserQueryParams) {
  return queryOptions({
    queryKey: [USERS_QUERY_KEY, params],
    queryFn: () => fetchUsers(params),
  });
}

export function useGetUsers(params: UserQueryParams) {
  return useQuery(getUsersQueryOptions(params));
}
