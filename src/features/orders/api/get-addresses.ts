import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Address } from "@/lib/supabase/types";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_ADDRESSES } from "@/lib/api-routes";

export const ADDRESSES_QUERY_KEY = "customer-addresses";

async function fetchAddresses(): Promise<{ data: Address[] }> {
  return fetchApi<{ data: Address[] }>(CUSTOMER_ADDRESSES);
}

export function getAddressesQueryOptions() {
  return queryOptions({
    queryKey: [ADDRESSES_QUERY_KEY],
    queryFn: fetchAddresses,
  });
}

export function useGetAddresses() {
  return useQuery(getAddressesQueryOptions());
}
