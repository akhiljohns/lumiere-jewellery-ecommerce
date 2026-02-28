import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CategoryUpdateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { CATEGORIES_QUERY_KEY } from "./get-categories";
import { CATEGORY_QUERY_KEY } from "./get-category";

async function updateCategory({
  id,
  data,
}: {
  id: string;
  data: CategoryUpdateInput;
}) {
  return fetchApi(`/api/admin/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CATEGORY_QUERY_KEY, variables.id],
      });
    },
  });
}
