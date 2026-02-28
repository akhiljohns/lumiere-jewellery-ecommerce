import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { adminOrder } from "@/lib/api-routes";
import { ORDERS_QUERY_KEY } from "./get-orders";
import { ORDER_QUERY_KEY } from "./get-order";

interface UpdateOrderStatusInput {
  status: string;
  cancelled_reason?: string;
}

async function updateOrderStatus({
  id,
  data,
}: {
  id: string;
  data: UpdateOrderStatusInput;
}) {
  return fetchApi(adminOrder(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ORDER_QUERY_KEY, variables.id],
      });
    },
  });
}
