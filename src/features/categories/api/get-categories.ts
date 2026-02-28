import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/supabase/types";
import { fetchApi } from "@/lib/api-client";

export const CATEGORIES_QUERY_KEY = "categories";

interface PaginatedCategories {
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  parent_id?: string;
  active_only?: boolean;
}

async function fetchCategories(
  params: CategoryQueryParams,
): Promise<PaginatedCategories> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.parent_id) searchParams.set("parent_id", params.parent_id);
  if (params.active_only !== undefined)
    searchParams.set("active_only", String(params.active_only));

  return fetchApi<PaginatedCategories>(
    `/api/admin/categories?${searchParams}`,
  );
}

export function getCategoriesQueryOptions(params: CategoryQueryParams) {
  return queryOptions({
    queryKey: [CATEGORIES_QUERY_KEY, params],
    queryFn: () => fetchCategories(params),
  });
}

export function useGetCategories(params: CategoryQueryParams = {}) {
  return useQuery(getCategoriesQueryOptions(params));
}
