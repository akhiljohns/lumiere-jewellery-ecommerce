import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { customerAddress } from "@/lib/api-routes";
import { ADDRESSES_QUERY_KEY } from "./get-addresses";

async function deleteAddress(id: string) {
  return fetchApi(customerAddress(id), {
    method: "DELETE",
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDRESSES_QUERY_KEY] });
    },
  });
}
