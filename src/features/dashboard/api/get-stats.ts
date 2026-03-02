import { queryOptions, useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@/features/dashboard/services/stats-service";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_STATS } from "@/lib/api-routes";

export const STATS_QUERY_KEY = "dashboard-stats";

async function fetchStats(): Promise<{ data: DashboardStats }> {
  return fetchApi<{ data: DashboardStats }>(ADMIN_STATS);
}

export function getStatsQueryOptions() {
  return queryOptions({
    queryKey: [STATS_QUERY_KEY],
    queryFn: fetchStats,
  });
}

export function useGetStats() {
  return useQuery({
    ...getStatsQueryOptions(),
    refetchInterval: 60_000, // Auto-refresh every 60 seconds
  });
}
