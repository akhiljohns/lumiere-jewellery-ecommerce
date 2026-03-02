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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [PRODUCTS_QUERY_KEY] });
      queryClient.setQueriesData(
        { queryKey: [PRODUCTS_QUERY_KEY] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.filter((p: { id: string }) => p.id !== id) };
        },
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
    },
  });
}
