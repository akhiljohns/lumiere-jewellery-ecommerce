import { useQuery, queryOptions } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_MEDIA } from "@/lib/api-routes";
import type { MediaListResponse } from "../types";

interface GetMediaParams {
  page?: number;
  limit?: number;
  search?: string;
}

async function getMedia(params: GetMediaParams = {}): Promise<MediaListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);

  const qs = searchParams.toString();
  return fetchApi<MediaListResponse>(`${ADMIN_MEDIA}${qs ? `?${qs}` : ""}`);
}

export function getMediaQueryOptions(params: GetMediaParams = {}) {
  return queryOptions({
    queryKey: ["admin", "media", params],
    queryFn: () => getMedia(params),
  });
}

export function useGetMedia(params: GetMediaParams = {}) {
  return useQuery(getMediaQueryOptions(params));
}
