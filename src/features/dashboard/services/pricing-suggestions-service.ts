import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ──────────────────────────────────────────

interface ProductForPricing {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  material: string | null;
  category_name: string | null;
  stock: number;
  total_sold: number;
}

interface PricingSuggestion {
  product_id: string;
  product_name: string;
  product_slug: string;
  current_price: number;
  current_compare_price: number | null;
  suggested_compare_price: number;
  discount_percentage: number;
  reason: string;
  category: string | null;
  material: string | null;
  priority: "high" | "medium" | "low";
}

interface MarginAnalysis {
  product_id: string;
  product_name: string;
  price: number;
  compare_price: number | null;
  margin_percentage: number | null;
  has_compare_price: boolean;
}

export interface PricingSuggestionsResponse {
  suggestions: PricingSuggestion[];
  margin_analysis: {
    products_without_compare_price: number;
    products_with_low_margin: MarginAnalysis[];
    products_with_high_margin: MarginAnalysis[];
    avg_discount_percentage: number;
  };
  category_pricing: CategoryPricing[];
  summary: {
    total_products: number;
    products_needing_attention: number;
    avg_price: number;
    avg_compare_price: number;
  };
}

interface CategoryPricing {
  category: string;
  product_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  avg_discount_pct: number;
}

// ── Get products with sales data ───────────────────

async function getProductsWithSalesData(): Promise<ProductForPricing[]> {
  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, price, compare_price, material, stock, categories(name)")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Failed to fetch products: ${error.message}`);

  // Get sales counts
  const { data: salesData } = await supabase
    .from("order_items")
    .select("product_id, quantity, orders!inner(status)")
    .in("orders.status", ["confirmed", "processing", "shipped", "delivered"]);

  const salesMap = new Map<string, number>();
  for (const item of salesData ?? []) {
    if (!item.product_id) continue;
    salesMap.set(item.product_id, (salesMap.get(item.product_id) ?? 0) + item.quantity);
  }

  return (products ?? []).map((p) => {
    const cats = p.categories as unknown as { name: string } | { name: string }[] | null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compare_price: p.compare_price ? Number(p.compare_price) : null,
      material: p.material,
      category_name: Array.isArray(cats) ? (cats[0]?.name ?? null) : (cats?.name ?? null),
      stock: p.stock,
      total_sold: salesMap.get(p.id) ?? 0,
    };
  });
}

// ── Generate pricing suggestions ───────────────────

function generateSuggestions(products: ProductForPricing[]): PricingSuggestion[] {
  const suggestions: PricingSuggestion[] = [];

  // Build category averages for reference pricing
  const categoryStats = new Map<string, { prices: number[]; comparePrices: number[] }>();

  for (const p of products) {
    const cat = p.category_name ?? "Uncategorized";
    const stats = categoryStats.get(cat) ?? { prices: [], comparePrices: [] };
    stats.prices.push(p.price);
    if (p.compare_price) stats.comparePrices.push(p.compare_price);
    categoryStats.set(cat, stats);
  }

  for (const product of products) {
    const cat = product.category_name ?? "Uncategorized";
    const stats = categoryStats.get(cat);
    const avgCategoryPrice = stats
      ? stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length
      : product.price;

    // Case 1: No compare_price set — suggest one based on standard markup
    if (!product.compare_price) {
      const markupPct = product.material?.toLowerCase().includes("gold") ? 0.15 : 0.20;
      const suggestedCompare = Math.ceil(product.price * (1 + markupPct));

      suggestions.push({
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        current_price: product.price,
        current_compare_price: null,
        suggested_compare_price: suggestedCompare,
        discount_percentage: Math.round(markupPct * 100),
        reason: "No compare price set. Adding a compare price creates urgency and shows value.",
        category: product.category_name,
        material: product.material,
        priority: product.total_sold > 0 ? "high" : "medium",
      });
      continue;
    }

    // Case 2: Compare price too close to price (< 5% discount shown)
    const currentDiscount = ((product.compare_price - product.price) / product.compare_price) * 100;
    if (currentDiscount < 5 && currentDiscount >= 0) {
      const suggestedCompare = Math.ceil(product.price * 1.15);
      suggestions.push({
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        current_price: product.price,
        current_compare_price: product.compare_price,
        suggested_compare_price: suggestedCompare,
        discount_percentage: 15,
        reason: `Current discount is only ${currentDiscount.toFixed(0)}%. A 10-20% discount display is more compelling.`,
        category: product.category_name,
        material: product.material,
        priority: "medium",
      });
      continue;
    }

    // Case 3: Product priced significantly below category average (potential to increase)
    if (product.price < avgCategoryPrice * 0.7 && product.total_sold > 2) {
      const suggestedCompare = Math.ceil(avgCategoryPrice);
      suggestions.push({
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        current_price: product.price,
        current_compare_price: product.compare_price,
        suggested_compare_price: suggestedCompare,
        discount_percentage: Math.round(((suggestedCompare - product.price) / suggestedCompare) * 100),
        reason: `Priced ${Math.round((1 - product.price / avgCategoryPrice) * 100)}% below category average (₹${Math.round(avgCategoryPrice)}). Strong seller — consider premium positioning.`,
        category: product.category_name,
        material: product.material,
        priority: "low",
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}

// ── Margin analysis ────────────────────────────────

function analyzeMargins(products: ProductForPricing[]) {
  const withoutCompare = products.filter((p) => !p.compare_price).length;

  const margins: MarginAnalysis[] = products
    .filter((p) => p.compare_price)
    .map((p) => ({
      product_id: p.id,
      product_name: p.name,
      price: p.price,
      compare_price: p.compare_price,
      margin_percentage: p.compare_price
        ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
        : null,
      has_compare_price: true,
    }));

  const lowMargin = margins
    .filter((m) => m.margin_percentage !== null && m.margin_percentage < 10)
    .sort((a, b) => (a.margin_percentage ?? 0) - (b.margin_percentage ?? 0));

  const highMargin = margins
    .filter((m) => m.margin_percentage !== null && m.margin_percentage > 40)
    .sort((a, b) => (b.margin_percentage ?? 0) - (a.margin_percentage ?? 0));

  const avgDiscount = margins.length > 0
    ? margins.reduce((sum, m) => sum + (m.margin_percentage ?? 0), 0) / margins.length
    : 0;

  return {
    products_without_compare_price: withoutCompare,
    products_with_low_margin: lowMargin.slice(0, 10),
    products_with_high_margin: highMargin.slice(0, 10),
    avg_discount_percentage: Math.round(avgDiscount),
  };
}

// ── Category pricing analysis ──────────────────────

function analyzeCategoryPricing(products: ProductForPricing[]): CategoryPricing[] {
  const catMap = new Map<string, ProductForPricing[]>();

  for (const p of products) {
    const cat = p.category_name ?? "Uncategorized";
    const list = catMap.get(cat) ?? [];
    list.push(p);
    catMap.set(cat, list);
  }

  return Array.from(catMap.entries()).map(([category, prods]) => {
    const prices = prods.map((p) => p.price);
    const discounts = prods
      .filter((p) => p.compare_price)
      .map((p) => ((p.compare_price! - p.price) / p.compare_price!) * 100);

    return {
      category,
      product_count: prods.length,
      avg_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
      avg_discount_pct: discounts.length > 0
        ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length)
        : 0,
    };
  });
}

// ── Main function ──────────────────────────────────

export async function getPricingSuggestions(): Promise<PricingSuggestionsResponse> {
  const products = await getProductsWithSalesData();
  const suggestions = generateSuggestions(products);
  const margins = analyzeMargins(products);
  const categoryPricing = analyzeCategoryPricing(products);

  const prices = products.map((p) => p.price);
  const comparePrices = products.filter((p) => p.compare_price).map((p) => p.compare_price!);

  return {
    suggestions: suggestions.slice(0, 50),
    margin_analysis: margins,
    category_pricing: categoryPricing,
    summary: {
      total_products: products.length,
      products_needing_attention: suggestions.length,
      avg_price: prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0,
      avg_compare_price: comparePrices.length > 0
        ? Math.round(comparePrices.reduce((a, b) => a + b, 0) / comparePrices.length)
        : 0,
    },
  };
}
