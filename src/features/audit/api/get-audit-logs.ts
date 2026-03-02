import { queryOptions, useQuery } from "@tanstack/react-query";
import type { PaginatedAuditLogs, AuditLogQueryParams } from "@/features/audit/types";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_AUDIT_LOGS } from "@/lib/api-routes";

export const AUDIT_LOGS_QUERY_KEY = "audit-logs";

async function fetchAuditLogs(params: AuditLogQueryParams): Promise<PaginatedAuditLogs> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.actor_email) searchParams.set("actor_email", params.actor_email);
  if (params.resource) searchParams.set("resource", params.resource);
  if (params.action) searchParams.set("action", params.action);
  if (params.resource_id) searchParams.set("resource_id", params.resource_id);
  if (params.date_from) searchParams.set("date_from", params.date_from);
  if (params.date_to) searchParams.set("date_to", params.date_to);

  return fetchApi<PaginatedAuditLogs>(`${ADMIN_AUDIT_LOGS}?${searchParams}`);
}

export function getAuditLogsQueryOptions(params: AuditLogQueryParams) {
  return queryOptions({
    queryKey: [AUDIT_LOGS_QUERY_KEY, params],
    queryFn: () => fetchAuditLogs(params),
  });
}

export function useGetAuditLogs(params: AuditLogQueryParams) {
  return useQuery(getAuditLogsQueryOptions(params));
}
