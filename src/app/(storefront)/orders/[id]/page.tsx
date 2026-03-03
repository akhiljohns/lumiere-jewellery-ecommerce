"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetProfile } from "@/features/auth/api/get-profile";
import { useGetCustomerOrder } from "@/features/orders/api/get-customer-order";
import { formatCurrency } from "@/lib/utils";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: profileData, isLoading: profileLoading } = useGetProfile();
  const { data, isLoading, error } = useGetCustomerOrder(id);

  const user = profileData?.data;

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
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          Sign in to view your order
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

  if (error || !data?.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Order not found
        </h1>
        <p className="mt-2 text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Could not load order details."}
        </p>
        <Link
          href="/orders"
          className={buttonVariants({ className: "mt-6" })}
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const order = data.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/orders"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-4",
        })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-lg font-semibold text-foreground">
              {order.order_number}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Package className="h-3 w-3" />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Placed on{" "}
          {new Date(order.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <Separator className="my-4" />

        {/* Items */}
        <div className="space-y-3">
          {order.order_items?.map(
            (item: {
              id: string;
              product_name: string;
              quantity: number;
              price: number;
              total: number;
            }) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ),
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.shipping_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatCurrency(order.shipping_fee)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Payment:{" "}
            {order.payment_method === "cod"
              ? "Cash on Delivery"
              : "Paid via Razorpay"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/orders"
          className={buttonVariants({ variant: "outline" })}
        >
          All Orders
        </Link>
        <Link href="/products" className={buttonVariants({ variant: "outline" })}>
          Continue Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
