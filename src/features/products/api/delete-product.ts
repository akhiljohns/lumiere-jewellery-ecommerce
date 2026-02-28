import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { adminProduct } from "@/lib/api-routes";
import { PRODUCTS_QUERY_KEY } from "./get-products";

async function deleteProduct(id: string) {
  return fetchApi(adminProduct(id), {
    method: "DELETE",
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
    },
  });
}
