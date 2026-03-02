"use client";

import { Clock, CheckCircle, Truck, Package, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface RecentOrdersTimelineProps {
  orders: RecentOrder[];
}

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

function formatTimeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function RecentOrdersTimeline({ orders }: RecentOrdersTimelineProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            No orders yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest {orders.length} orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => {
            const Icon = statusIcons[order.status] ?? Clock;
            return (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">
                      #{order.order_number}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(order.total)}
                  </span>
                  <Badge
                    variant={
                      order.status === "delivered"
                        ? "default"
                        : order.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
