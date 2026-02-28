import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AddressUpdateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { customerAddress } from "@/lib/api-routes";
import { ADDRESSES_QUERY_KEY } from "./get-addresses";
import { ADDRESS_QUERY_KEY } from "./get-address";

async function updateAddress({
  id,
  data,
}: {
  id: string;
  data: AddressUpdateInput;
}) {
  return fetchApi(customerAddress(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAddress,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ADDRESSES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ADDRESS_QUERY_KEY, variables.id],
      });
    },
  });
}
