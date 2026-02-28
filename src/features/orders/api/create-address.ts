import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AddressCreateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_ADDRESSES } from "@/lib/api-routes";
import { ADDRESSES_QUERY_KEY } from "./get-addresses";

async function createAddress(data: AddressCreateInput) {
  return fetchApi(CUSTOMER_ADDRESSES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDRESSES_QUERY_KEY] });
    },
  });
}
