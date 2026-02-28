import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CategoryCreateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_CATEGORIES } from "@/lib/api-routes";
import { CATEGORIES_QUERY_KEY } from "./get-categories";

async function createCategory(data: CategoryCreateInput) {
  return fetchApi(ADMIN_CATEGORIES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}
