import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { adminCategory } from "@/lib/api-routes";
import { CATEGORIES_QUERY_KEY } from "./get-categories";

async function deleteCategory(id: string) {
  return fetchApi(adminCategory(id), {
    method: "DELETE",
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [CATEGORIES_QUERY_KEY] });
      queryClient.setQueriesData(
        { queryKey: [CATEGORIES_QUERY_KEY] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.filter((c: { id: string }) => c.id !== id) };
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
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}
