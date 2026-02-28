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
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();

  const [productStats, userStats, orderStats] = await Promise.all([
    getProductStats(supabase),
    getUserStats(supabase),
    getOrderStats(supabase),
  ]);

  return {
    products: productStats,
    users: userStats,
    orders: orderStats,
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
