import type { AuditLog } from "@/lib/supabase/types";

export type { AuditLog };

export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  actor_email?: string;
  resource?: string;
  action?: string;
  resource_id?: string;
  date_from?: string;
  date_to?: string;
}
