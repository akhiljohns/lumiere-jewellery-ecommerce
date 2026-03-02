"use client";

import { AlertTriangle, PackageX, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetInventoryAlerts } from "@/features/dashboard/api/get-inventory-alerts";
import { Skeleton } from "@/components/ui/skeleton";

export function InventoryAlertsWidget() {
  const { data, isLoading } = useGetInventoryAlerts();
  const alerts = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!alerts) return null;

  const hasAlerts =
    alerts.out_of_stock.length > 0 ||
    alerts.restock_recommendations.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Inventory Alerts
        </CardTitle>
        <CardDescription>
          {alerts.summary.out_of_stock_count} out of stock,{" "}
          {alerts.summary.low_stock_count} low stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAlerts ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            All products are well-stocked
          </p>
        ) : (
          <div className="space-y-3">
            {/* Out of stock */}
            {alerts.out_of_stock.slice(0, 3).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <PackageX className="size-4 text-destructive" />
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
                <Badge variant="destructive">Out of stock</Badge>
              </div>
            ))}

            {/* Critical restock */}
            {alerts.restock_recommendations
              .filter((r) => r.urgency === "critical")
              .slice(0, 3)
              .map((rec) => (
                <div
                  key={rec.product_id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="size-4 text-destructive" />
                    <div>
                      <span className="text-sm font-medium">{rec.product_name}</span>
                      <p className="text-xs text-muted-foreground">
                        {rec.current_stock} left · ~{rec.days_until_stockout}d until stockout
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
              ))}

            {/* Warning restock */}
            {alerts.restock_recommendations
              .filter((r) => r.urgency === "warning")
              .slice(0, 3)
              .map((rec) => (
                <div
                  key={rec.product_id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="size-4 text-primary" />
                    <div>
                      <span className="text-sm font-medium">{rec.product_name}</span>
                      <p className="text-xs text-muted-foreground">
                        {rec.current_stock} left · ~{rec.days_until_stockout}d until stockout
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Warning</Badge>
                </div>
              ))}

            {/* Low stock products */}
            {alerts.low_stock.slice(0, 3).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{product.name}</span>
                    <p className="text-xs text-muted-foreground">
                      {product.stock} units remaining
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Low</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
