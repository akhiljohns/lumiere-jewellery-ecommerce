"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useQueryState, parseAsInteger, parseAsStringLiteral } from "nuqs";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { useGetAuditLogs } from "@/features/audit/api/get-audit-logs";
import { getAuditLogColumns } from "@/features/audit/components/audit-log-columns";

const ACTION_OPTIONS = ["all", "created", "updated", "deleted"] as const;
const RESOURCE_OPTIONS = ["all", "Product", "User", "Category", "Order"] as const;

export default function AuditLogsPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [action, setAction] = useQueryState(
    "action",
    parseAsStringLiteral(ACTION_OPTIONS).withDefault("all"),
  );
  const [resource, setResource] = useQueryState(
    "resource",
    parseAsStringLiteral(RESOURCE_OPTIONS).withDefault("all"),
  );

  const { data, isLoading } = useGetAuditLogs({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    action: action === "all" ? undefined : action,
    resource: resource === "all" ? undefined : resource,
    sort: "created_at",
    order: "desc",
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      return () => clearTimeout(timeout);
    },
    [setSearch, setPage],
  );

  const columns = useMemo(() => getAuditLogColumns(), []);

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Track all admin actions and changes
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email, resource..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v as (typeof ACTION_OPTIONS)[number]);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={resource}
          onValueChange={(v) => {
            setResource(v as (typeof RESOURCE_OPTIONS)[number]);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Category">Category</SelectItem>
            <SelectItem value="Order">Order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        pageCount={pagination.totalPages}
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
