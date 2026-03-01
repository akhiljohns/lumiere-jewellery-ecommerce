"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetCustomerOrder } from "@/features/orders/api/get-customer-order";
import { formatCurrency } from "@/lib/utils";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  const { data, isLoading, error } = useGetCustomerOrder(orderId ?? "");

  if (!orderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          No order found
        </h1>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Order not found
        </h1>
        <p className="mt-2 text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Could not load order details."}
        </p>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  const order = data.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Success Header */}
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Order Placed Successfully!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your order. We&apos;ll send you a confirmation email
          shortly.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="mt-8 rounded-lg border border-border bg-card p-6">
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
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/products" className={buttonVariants({ variant: "outline" })}>
          Continue Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
