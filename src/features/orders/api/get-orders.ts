import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PaginatedOrders, OrderQueryParams } from "@/features/orders/types";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_ORDERS } from "@/lib/api-routes";

export const ORDERS_QUERY_KEY = "orders";

async function fetchOrders(params: OrderQueryParams): Promise<PaginatedOrders> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.payment_status)
    searchParams.set("payment_status", params.payment_status);
  if (params.customer_id)
    searchParams.set("customer_id", params.customer_id);
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);

  return fetchApi<PaginatedOrders>(`${ADMIN_ORDERS}?${searchParams}`);
}

export function getOrdersQueryOptions(params: OrderQueryParams) {
  return queryOptions({
    queryKey: [ORDERS_QUERY_KEY, params],
    queryFn: () => fetchOrders(params),
  });
}

export function useGetOrders(params: OrderQueryParams) {
  return useQuery(getOrdersQueryOptions(params));
}
