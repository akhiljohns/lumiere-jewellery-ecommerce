import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/supabase/types";
import { fetchApi } from "@/lib/api-client";
import { adminCategory } from "@/lib/api-routes";

export const CATEGORY_QUERY_KEY = "category";

async function fetchCategory(id: string): Promise<{ data: Category }> {
  return fetchApi<{ data: Category }>(adminCategory(id));
}

export function getCategoryQueryOptions(id: string) {
  return queryOptions({
    queryKey: [CATEGORY_QUERY_KEY, id],
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  });
}

export function useGetCategory(id: string) {
  return useQuery(getCategoryQueryOptions(id));
}
