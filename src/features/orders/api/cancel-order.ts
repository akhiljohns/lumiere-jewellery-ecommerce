import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { customerOrderCancel } from "@/lib/api-routes";
import { CUSTOMER_ORDERS_QUERY_KEY } from "./get-customer-orders";
import { CUSTOMER_ORDER_QUERY_KEY } from "./get-customer-order";

async function cancelOrder({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}) {
  return fetchApi(customerOrderCancel(id), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CUSTOMER_ORDERS_QUERY_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [CUSTOMER_ORDER_QUERY_KEY, variables.id],
      });
    },
  });
}
