"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useGetProfile } from "@/features/auth/api/get-profile";
import { useGetCustomerOrders } from "@/features/orders/api/get-customer-orders";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const { data: profileData, isLoading: profileLoading } = useGetProfile();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetCustomerOrders({
    page,
    limit: 10,
    sort: "created_at",
    order: "desc",
  });

  const user = profileData?.data;
  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  if (profileLoading || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package className="mx-auto size-16 text-muted-foreground/50" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Sign in to view your orders
        </h1>
        <Link
          href="/signin"
          className={buttonVariants({ className: "mt-6" })}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">My Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-12 text-center">
          <Package className="mx-auto size-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No orders yet
          </h2>
          <p className="mt-2 text-muted-foreground">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className={buttonVariants({ className: "mt-6" })}
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {order.order_number}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {order.order_items.length}{" "}
                    {order.order_items.length === 1 ? "item" : "items"}
                    {" — "}
                    {order.order_items
                      .slice(0, 3)
                      .map((item) => item.product_name)
                      .join(", ")}
                    {order.order_items.length > 3 && "..."}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
