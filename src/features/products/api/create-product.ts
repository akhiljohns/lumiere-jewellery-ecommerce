import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductCreateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_PRODUCTS } from "@/lib/api-routes";
import { PRODUCTS_QUERY_KEY } from "./get-products";

async function createProduct(data: ProductCreateInput) {
  return fetchApi(ADMIN_PRODUCTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
    },
  });
}
