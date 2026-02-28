import { queryOptions, useQuery } from "@tanstack/react-query";
import type {
  PaginatedOrders,
  CustomerOrderQueryParams,
} from "@/features/orders/types";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_ORDERS } from "@/lib/api-routes";

export const CUSTOMER_ORDERS_QUERY_KEY = "customer-orders";

async function fetchCustomerOrders(
  params: CustomerOrderQueryParams,
): Promise<PaginatedOrders> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);

  return fetchApi<PaginatedOrders>(`${CUSTOMER_ORDERS}?${searchParams}`);
}

export function getCustomerOrdersQueryOptions(
  params: CustomerOrderQueryParams,
) {
  return queryOptions({
    queryKey: [CUSTOMER_ORDERS_QUERY_KEY, params],
    queryFn: () => fetchCustomerOrders(params),
  });
}

export function useGetCustomerOrders(params: CustomerOrderQueryParams) {
  return useQuery(getCustomerOrdersQueryOptions(params));
}
