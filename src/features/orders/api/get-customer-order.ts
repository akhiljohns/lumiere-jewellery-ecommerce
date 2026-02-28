import { queryOptions, useQuery } from "@tanstack/react-query";
import type { OrderWithItems } from "@/features/orders/types";
import { fetchApi } from "@/lib/api-client";
import { customerOrder } from "@/lib/api-routes";

export const CUSTOMER_ORDER_QUERY_KEY = "customer-order";

async function fetchCustomerOrder(
  id: string,
): Promise<{ data: OrderWithItems }> {
  return fetchApi<{ data: OrderWithItems }>(customerOrder(id));
}

export function getCustomerOrderQueryOptions(id: string) {
  return queryOptions({
    queryKey: [CUSTOMER_ORDER_QUERY_KEY, id],
    queryFn: () => fetchCustomerOrder(id),
    enabled: !!id,
  });
}

export function useGetCustomerOrder(id: string) {
  return useQuery(getCustomerOrderQueryOptions(id));
}
