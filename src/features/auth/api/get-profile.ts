import { queryOptions, useQuery } from "@tanstack/react-query";
import type { SafeUser } from "@/features/users/types";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_PROFILE } from "@/lib/api-routes";

export const CUSTOMER_PROFILE_QUERY_KEY = "customer-profile";

async function fetchProfile(): Promise<{ data: SafeUser }> {
  return fetchApi<{ data: SafeUser }>(CUSTOMER_PROFILE);
}

export function getProfileQueryOptions() {
  return queryOptions({
    queryKey: [CUSTOMER_PROFILE_QUERY_KEY],
    queryFn: fetchProfile,
  });
}

export function useGetProfile() {
  return useQuery(getProfileQueryOptions());
}
