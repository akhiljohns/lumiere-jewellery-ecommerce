import { queryOptions, useQuery } from "@tanstack/react-query";
import type { CategoryWithCount } from "@/features/storefront/types";
import { fetchApi } from "@/lib/api-client";
import { PUBLIC_CATEGORIES } from "@/lib/api-routes";

export const PUBLIC_CATEGORIES_QUERY_KEY = "public-categories";

async function fetchPublicCategories(): Promise<{
  data: CategoryWithCount[];
}> {
  return fetchApi<{ data: CategoryWithCount[] }>(PUBLIC_CATEGORIES);
}

export function getPublicCategoriesQueryOptions() {
  return queryOptions({
    queryKey: [PUBLIC_CATEGORIES_QUERY_KEY],
    queryFn: fetchPublicCategories,
  });
}

export function useGetPublicCategories() {
  return useQuery(getPublicCategoriesQueryOptions());
}
