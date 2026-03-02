import { createAdminClient } from "@/lib/supabase/admin";

export interface DashboardStats {
  products: {
    total: number;
    active: number;
    inactive: number;
    out_of_stock: number;
    inventory_value: number;
  };
  users: {
    total: number;
    customers: number;
    admins: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    revenue: number;
  };
  revenue_trend: { date: string; revenue: number; orders: number }[];
  top_products: { name: string; sold: number; revenue: number }[];
  recent_orders: {
    id: string;
    order_number: string;
    total: number;
    status: string;
    payment_status: string;
    created_at: string;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();

  const [productStats, userStats, orderStats, revenueTrend, topProducts, recentOrders] =
    await Promise.all([
      getProductStats(supabase),
      getUserStats(supabase),
      getOrderStats(supabase),
      getRevenueTrend(supabase),
      getTopProducts(supabase),
      getRecentOrders(supabase),
    ]);

  return {
    products: productStats,
    users: userStats,
    orders: orderStats,
    revenue_trend: revenueTrend,
    top_products: topProducts,
    recent_orders: recentOrders,
  };
}

async function getProductStats(supabase: ReturnType<typeof createAdminClient>) {
  // Total count
  const { count: total } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  // Active count
  const { count: active } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  // Out of stock count
  const { count: outOfStock } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("stock", 0);

  // Inventory value — fetch price and stock for all products
  const { data: products } = await supabase
    .from("products")
    .select("price, stock");

  const inventoryValue = (products ?? []).reduce(
    (sum, p) => sum + p.price * p.stock,
    0,
  );

  const totalCount = total ?? 0;
  const activeCount = active ?? 0;

  return {
    total: totalCount,
    active: activeCount,
    inactive: totalCount - activeCount,
    out_of_stock: outOfStock ?? 0,
    inventory_value: inventoryValue,
  };
}

async function getUserStats(supabase: ReturnType<typeof createAdminClient>) {
  // Total count
  const { count: total } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  // Customer count
  const { count: customers } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer");

  const totalCount = total ?? 0;
  const customerCount = customers ?? 0;

  return {
    total: totalCount,
    customers: customerCount,
    admins: totalCount - customerCount,
  };
}

async function getOrderStats(supabase: ReturnType<typeof createAdminClient>) {
  // Total count
  const { count: total } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  // Status counts
  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ] as const;

  const statusCounts: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      statusCounts[status] = count ?? 0;
    }),
  );

  // Revenue — sum of total for paid orders
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("payment_status", "paid");

  const revenue = (paidOrders ?? []).reduce(
    (sum, o) => sum + Number(o.total),
    0,
  );

  return {
    total: total ?? 0,
    pending: statusCounts.pending ?? 0,
    confirmed: statusCounts.confirmed ?? 0,
    processing: statusCounts.processing ?? 0,
    shipped: statusCounts.shipped ?? 0,
    delivered: statusCounts.delivered ?? 0,
    cancelled: statusCounts.cancelled ?? 0,
    revenue,
  };
}

async function getRevenueTrend(supabase: ReturnType<typeof createAdminClient>) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("total, created_at, payment_status")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // Group by date
  const dayMap = new Map<string, { revenue: number; orders: number }>();

  // Initialize all 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dayMap.set(key, { revenue: 0, orders: 0 });
  }

  for (const order of orders ?? []) {
    const day = order.created_at.split("T")[0];
    const entry = dayMap.get(day);
    if (entry) {
      entry.orders += 1;
      if (order.payment_status === "paid") {
        entry.revenue += Number(order.total);
      }
    }
  }

  return Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue),
    orders: data.orders,
  }));
}

async function getTopProducts(supabase: ReturnType<typeof createAdminClient>) {
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_name, quantity, total, orders!inner(status)")
    .in("orders.status", ["confirmed", "processing", "shipped", "delivered"]);

  const productMap = new Map<string, { sold: number; revenue: number }>();

  for (const item of orderItems ?? []) {
    const existing = productMap.get(item.product_name) ?? { sold: 0, revenue: 0 };
    existing.sold += item.quantity;
    existing.revenue += Number(item.total);
    productMap.set(item.product_name, existing);
  }

  return Array.from(productMap.entries())
    .map(([name, data]) => ({ name, sold: data.sold, revenue: Math.round(data.revenue) }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
}

async function getRecentOrders(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, total, status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    total: Number(o.total),
    status: o.status,
    payment_status: o.payment_status,
    created_at: o.created_at,
  }));
}
