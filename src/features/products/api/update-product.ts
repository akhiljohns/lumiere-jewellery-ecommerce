import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductUpdateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { adminProduct } from "@/lib/api-routes";
import { PRODUCTS_QUERY_KEY } from "./get-products";
import { PRODUCT_QUERY_KEY } from "./get-product";

async function updateProduct({
  id,
  data,
}: {
  id: string;
  data: ProductUpdateInput;
}) {
  return fetchApi(adminProduct(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_QUERY_KEY, variables.id],
      });
    },
  });
}
