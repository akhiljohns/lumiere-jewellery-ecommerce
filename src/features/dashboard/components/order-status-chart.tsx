"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface OrderStatusChartProps {
  orders: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

const chartConfig = {
  count: {
    label: "Orders",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function OrderStatusChart({ orders }: OrderStatusChartProps) {
  const data = [
    { status: "Pending", count: orders.pending },
    { status: "Confirmed", count: orders.confirmed },
    { status: "Processing", count: orders.processing },
    { status: "Shipped", count: orders.shipped },
    { status: "Delivered", count: orders.delivered },
    { status: "Cancelled", count: orders.cancelled },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} accessibilityLayer layout="vertical">
            <XAxis type="number" hide />
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              tickMargin={4}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-primary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
