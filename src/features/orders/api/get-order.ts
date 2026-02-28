import { queryOptions, useQuery } from "@tanstack/react-query";
import type { OrderWithItems } from "@/features/orders/types";
import { fetchApi } from "@/lib/api-client";
import { adminOrder } from "@/lib/api-routes";

export const ORDER_QUERY_KEY = "order";

async function fetchOrder(id: string): Promise<{ data: OrderWithItems }> {
  return fetchApi<{ data: OrderWithItems }>(adminOrder(id));
}

export function getOrderQueryOptions(id: string) {
  return queryOptions({
    queryKey: [ORDER_QUERY_KEY, id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });
}

export function useGetOrder(id: string) {
  return useQuery(getOrderQueryOptions(id));
}
