"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useGetOrders } from "@/features/orders/api/get-orders";
import { getOrderQueryOptions } from "@/features/orders/api/get-order";
import { getOrderColumns } from "@/features/orders/components/order-columns";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const PAYMENT_OPTIONS = [
  "all",
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export default function OrdersPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUS_OPTIONS).withDefault("all"),
  );
  const [paymentStatus, setPaymentStatus] = useQueryState(
    "payment",
    parseAsStringLiteral(PAYMENT_OPTIONS).withDefault("all"),
  );

  const { data, isLoading } = useGetOrders({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    payment_status: paymentStatus === "all" ? undefined : paymentStatus,
    sort: "created_at",
    order: "desc",
  });

  const queryClient = useQueryClient();

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

  const columns = useMemo(
    () =>
      getOrderColumns({
        onPrefetch: (id) => queryClient.prefetchQuery(getOrderQueryOptions(id)),
      }),
    [queryClient],
  );

  const orders = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage customer orders
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-48">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as (typeof STATUS_OPTIONS)[number]);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Order status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={paymentStatus}
          onValueChange={(v) => {
            setPaymentStatus(v as (typeof PAYMENT_OPTIONS)[number]);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        pageCount={pagination.totalPages}
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={setPage}
        isLoading={isLoading}
        getRowHref={(row) => `/admin/orders/${row.id}`}
      />
    </div>
  );
}
