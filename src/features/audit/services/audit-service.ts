import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaginationMeta } from "@/lib/utils";
import type { AuditLog, AuditLogInsert } from "@/lib/supabase/types";
import type { AuditLogQueryInput } from "@/lib/validators";

// ── Types ──────────────────────────────────────────

export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

export interface CreateAuditLogInput {
  action: string;
  resource: string;
  resource_id?: string | null;
  actor_id?: string | null;
  actor_email: string;
  details?: Record<string, unknown>;
  ip_address?: string | null;
}

// ── Create ────────────────────────────────────────

export async function createAuditLog(
  input: CreateAuditLogInput,
): Promise<void> {
  const supabase = createAdminClient();

  const insertData: AuditLogInsert = {
    action: input.action,
    resource: input.resource,
    resource_id: input.resource_id ?? null,
    actor_id: input.actor_id ?? null,
    actor_email: input.actor_email,
    details: input.details ?? {},
    ip_address: input.ip_address ?? null,
  };

  const { error } = await supabase.from("audit_logs").insert(insertData);

  if (error) {
    // Silently fail — audit log errors must never break the application
    console.error("[audit] Failed to persist audit log:", error.message);
  }
}

// ── List ───────────────────────────────────────────

export async function getAuditLogs(
  query: AuditLogQueryInput,
): Promise<PaginatedAuditLogs> {
  const supabase = createAdminClient();
  const {
    page,
    limit,
    search,
    sort,
    order,
    actor_email,
    resource,
    action,
    resource_id,
    date_from,
    date_to,
  } = query;
  const offset = (page - 1) * limit;

  let queryBuilder = supabase
    .from("audit_logs")
    .select("*", { count: "exact" });

  if (actor_email) {
    queryBuilder = queryBuilder.eq("actor_email", actor_email);
  }

  if (resource) {
    queryBuilder = queryBuilder.eq("resource", resource);
  }

  if (action) {
    queryBuilder = queryBuilder.eq("action", action);
  }

  if (resource_id) {
    queryBuilder = queryBuilder.eq("resource_id", resource_id);
  }

  if (date_from) {
    queryBuilder = queryBuilder.gte("created_at", date_from);
  }

  if (date_to) {
    queryBuilder = queryBuilder.lte("created_at", date_to);
  }

  if (search) {
    queryBuilder = queryBuilder.or(
      `actor_email.ilike.%${search}%,resource.ilike.%${search}%,resource_id.ilike.%${search}%`,
    );
  }

  queryBuilder = queryBuilder
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await queryBuilder;

  if (error) throw new Error(error.message);

  return {
    data: (data as AuditLog[]) ?? [],
    pagination: buildPaginationMeta(page, limit, count ?? 0),
  };
}
