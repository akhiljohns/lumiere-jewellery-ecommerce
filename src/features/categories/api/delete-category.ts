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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}
