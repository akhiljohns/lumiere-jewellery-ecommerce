import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ──────────────────────────────────────────

interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
  price: number;
  material: string | null;
  category_name: string | null;
}

interface SalesVelocity {
  product_id: string;
  product_name: string;
  total_sold: number;
  avg_daily_sales: number;
  days_until_stockout: number | null;
  current_stock: number;
}

interface RestockRecommendation {
  product_id: string;
  product_name: string;
  current_stock: number;
  avg_daily_sales: number;
  days_until_stockout: number | null;
  recommended_restock_qty: number;
  urgency: "critical" | "warning" | "low";
}

export interface InventoryAlertsResponse {
  low_stock: LowStockProduct[];
  out_of_stock: LowStockProduct[];
  sales_velocity: SalesVelocity[];
  restock_recommendations: RestockRecommendation[];
  summary: {
    total_products: number;
    out_of_stock_count: number;
    low_stock_count: number;
    critical_alerts: number;
  };
}

// ── Low stock threshold ────────────────────────────

const LOW_STOCK_THRESHOLD = 10;
const RESTOCK_DAYS_BUFFER = 30; // Recommend enough stock for 30 days

// ── Get low stock products ─────────────────────────

async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, stock, price, material, categories(name)")
    .eq("is_active", true)
    .gt("stock", 0)
    .lte("stock", LOW_STOCK_THRESHOLD)
    .order("stock", { ascending: true });

  if (error) throw new Error(`Failed to fetch low stock products: ${error.message}`);

  return (data ?? []).map((p) => {
    const cats = p.categories as unknown as { name: string } | { name: string }[] | null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      price: p.price,
      material: p.material,
      category_name: Array.isArray(cats) ? (cats[0]?.name ?? null) : (cats?.name ?? null),
    };
  });
}

// ── Get out of stock products ──────────────────────

async function getOutOfStockProducts(): Promise<LowStockProduct[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, stock, price, material, categories(name)")
    .eq("is_active", true)
    .eq("stock", 0)
    .order("name");

  if (error) throw new Error(`Failed to fetch out of stock products: ${error.message}`);

  return (data ?? []).map((p) => {
    const cats = p.categories as unknown as { name: string } | { name: string }[] | null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      price: p.price,
      material: p.material,
      category_name: Array.isArray(cats) ? (cats[0]?.name ?? null) : (cats?.name ?? null),
    };
  });
}

// ── Calculate sales velocity ───────────────────────

async function getSalesVelocity(days: number = 30): Promise<SalesVelocity[]> {
  const supabase = createAdminClient();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  // Get order items from completed orders in the last N days
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, orders!inner(status, created_at)")
    .gte("orders.created_at", sinceDate.toISOString())
    .in("orders.status", ["confirmed", "processing", "shipped", "delivered"]);

  if (error) throw new Error(`Failed to fetch order items: ${error.message}`);

  // Aggregate by product
  const productSales = new Map<string, { name: string; total: number }>();

  for (const item of orderItems ?? []) {
    if (!item.product_id) continue;
    const existing = productSales.get(item.product_id);
    if (existing) {
      existing.total += item.quantity;
    } else {
      productSales.set(item.product_id, {
        name: item.product_name,
        total: item.quantity,
      });
    }
  }

  // Get current stock for these products
  const productIds = Array.from(productSales.keys());
  if (productIds.length === 0) return [];

  const { data: products } = await supabase
    .from("products")
    .select("id, stock")
    .in("id", productIds);

  const stockMap = new Map((products ?? []).map((p) => [p.id, p.stock]));

  const velocities: SalesVelocity[] = [];

  for (const [productId, sales] of productSales) {
    const avgDaily = sales.total / days;
    const currentStock = stockMap.get(productId) ?? 0;
    const daysUntilStockout = avgDaily > 0 ? Math.floor(currentStock / avgDaily) : null;

    velocities.push({
      product_id: productId,
      product_name: sales.name,
      total_sold: sales.total,
      avg_daily_sales: Math.round(avgDaily * 100) / 100,
      days_until_stockout: daysUntilStockout,
      current_stock: currentStock,
    });
  }

  // Sort by days until stockout (most urgent first)
  velocities.sort((a, b) => {
    if (a.days_until_stockout === null) return 1;
    if (b.days_until_stockout === null) return -1;
    return a.days_until_stockout - b.days_until_stockout;
  });

  return velocities;
}

// ── Generate restock recommendations ───────────────

function generateRestockRecommendations(
  velocities: SalesVelocity[],
): RestockRecommendation[] {
  return velocities
    .filter((v) => v.days_until_stockout !== null && v.days_until_stockout < RESTOCK_DAYS_BUFFER)
    .map((v) => {
      const neededForBuffer = Math.ceil(v.avg_daily_sales * RESTOCK_DAYS_BUFFER);
      const recommended = Math.max(0, neededForBuffer - v.current_stock);

      let urgency: "critical" | "warning" | "low" = "low";
      if (v.days_until_stockout !== null) {
        if (v.days_until_stockout <= 3) urgency = "critical";
        else if (v.days_until_stockout <= 14) urgency = "warning";
      }

      return {
        product_id: v.product_id,
        product_name: v.product_name,
        current_stock: v.current_stock,
        avg_daily_sales: v.avg_daily_sales,
        days_until_stockout: v.days_until_stockout,
        recommended_restock_qty: recommended,
        urgency,
      };
    })
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
}

// ── Main inventory alerts function ─────────────────

export async function getInventoryAlerts(): Promise<InventoryAlertsResponse> {
  const [lowStock, outOfStock, velocities] = await Promise.all([
    getLowStockProducts(),
    getOutOfStockProducts(),
    getSalesVelocity(30),
  ]);

  const recommendations = generateRestockRecommendations(velocities);

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return {
    low_stock: lowStock,
    out_of_stock: outOfStock,
    sales_velocity: velocities.slice(0, 20),
    restock_recommendations: recommendations,
    summary: {
      total_products: count ?? 0,
      out_of_stock_count: outOfStock.length,
      low_stock_count: lowStock.length,
      critical_alerts: recommendations.filter((r) => r.urgency === "critical").length,
    },
  };
}

// ── Discord alert for low stock (cron-friendly) ────

export async function sendLowStockDiscordAlert(): Promise<void> {
  const { logToDiscord } = await import("@/lib/discord");

  const alerts = await getInventoryAlerts();
  const critical = alerts.restock_recommendations.filter((r) => r.urgency === "critical");
  const outOfStock = alerts.out_of_stock;

  if (critical.length === 0 && outOfStock.length === 0) return;

  const fields: { name: string; value: string; inline?: boolean }[] = [];

  if (outOfStock.length > 0) {
    fields.push({
      name: `Out of Stock (${outOfStock.length})`,
      value: outOfStock.slice(0, 5).map((p) => `• ${p.name}`).join("\n"),
    });
  }

  if (critical.length > 0) {
    fields.push({
      name: `Critical Low Stock (${critical.length})`,
      value: critical
        .slice(0, 5)
        .map((r) => `• ${r.product_name}: ${r.current_stock} left (~${r.days_until_stockout}d)`)
        .join("\n"),
    });
  }

  await logToDiscord({
    title: "Inventory Alert",
    description: `${outOfStock.length} out of stock, ${critical.length} critical low stock`,
    fields,
    level: critical.length > 0 ? "error" : "warning",
  });
}
