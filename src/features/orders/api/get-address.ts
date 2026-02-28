import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Address } from "@/lib/supabase/types";
import { fetchApi } from "@/lib/api-client";
import { customerAddress } from "@/lib/api-routes";

export const ADDRESS_QUERY_KEY = "customer-address";

async function fetchAddress(id: string): Promise<{ data: Address }> {
  return fetchApi<{ data: Address }>(customerAddress(id));
}

export function getAddressQueryOptions(id: string) {
  return queryOptions({
    queryKey: [ADDRESS_QUERY_KEY, id],
    queryFn: () => fetchAddress(id),
    enabled: !!id,
  });
}

export function useGetAddress(id: string) {
  return useQuery(getAddressQueryOptions(id));
}
