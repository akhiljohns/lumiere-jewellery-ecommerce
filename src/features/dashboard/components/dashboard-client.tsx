"use client";

import {
  Package,
  Users,
  IndianRupee,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStats } from "@/features/dashboard/api/get-stats";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "./revenue-chart";
import { OrderStatusChart } from "./order-status-chart";
import { TopProductsChart } from "./top-products-chart";
import { InventoryAlertsWidget } from "./inventory-alerts-widget";
import { RecentOrdersTimeline } from "./recent-orders-timeline";

export function DashboardClient() {
  const { data, isLoading } = useGetStats();
  const stats = data?.data;

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.products.total,
      icon: Package,
      description: `${stats.products.active} active, ${stats.products.inactive} inactive`,
    },
    {
      title: "Total Users",
      value: stats.users.total,
      icon: Users,
      description: `${stats.users.admins} admins, ${stats.users.customers} customers`,
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats.products.inventory_value),
      icon: IndianRupee,
      description: "Total stock value",
    },
    {
      title: "Out of Stock",
      value: stats.products.out_of_stock,
      icon: AlertTriangle,
      description:
        stats.products.out_of_stock > 0 ? "Needs attention" : "All stocked",
    },
    {
      title: "Total Orders",
      value: stats.orders.total,
      icon: ShoppingCart,
      description: `${stats.orders.pending} pending, ${stats.orders.processing} processing`,
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.orders.revenue),
      icon: TrendingUp,
      description: `${stats.orders.delivered} delivered`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={stats.revenue_trend} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OrderStatusChart orders={stats.orders} />
        <TopProductsChart data={stats.top_products} />
      </div>

      {/* Alerts + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InventoryAlertsWidget />
        <RecentOrdersTimeline orders={stats.recent_orders} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[380px] w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px] w-full rounded-lg" />
        <Skeleton className="h-[380px] w-full rounded-lg" />
      </div>
    </div>
  );
}
