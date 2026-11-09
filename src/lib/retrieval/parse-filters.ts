// ── Turn a shopping question into hard filters ─────
//
// Prices, categories, materials, stock and sale words are read deterministically so the
// database can enforce them. Everything else is left to full-text and vector search.

export interface StoreVocabulary {
  categories: { id: string; name: string }[];
  materials: string[];
}

export interface ProductFilters {
  categoryIds: string[];
  categoryNames: string[];
  materialNames: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
}

// ── Price ──────────────────────────────────────────

const AMOUNT = String.raw`(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakhs?|lacs?|l)?\b`;

function toRupees(digits: string, unit: string | undefined): number {
  const value = Number(digits.replace(/,/g, ""));
  if (!unit) return value;
  if (unit === "k") return value * 1_000;
  return value * 100_000; // lakh, lakhs, lac, lacs, l
}

const RANGE = new RegExp(String.raw`\b(?:between|from)\s+${AMOUNT}\s*(?:and|to|-)\s*${AMOUNT}`, "i");
const MAX = new RegExp(
  String.raw`\b(?:under|below|less than|within|up ?to|max(?:imum)?|not more than|cheaper than|budget(?: of)?)\s+${AMOUNT}`,
  "i",
);
const MIN = new RegExp(String.raw`\b(?:above|over|more than|at least|min(?:imum)?|starting(?: at| from)?)\s+${AMOUNT}`, "i");

function parsePrice(text: string): { minPrice: number | null; maxPrice: number | null } {
  const range = RANGE.exec(text);
  if (range) {
    const a = toRupees(range[1], range[2]?.toLowerCase());
    const b = toRupees(range[3], range[4]?.toLowerCase());
    return { minPrice: Math.min(a, b), maxPrice: Math.max(a, b) };
  }
  const max = MAX.exec(text);
  const min = MIN.exec(text);
  return {
    minPrice: min ? toRupees(min[1], min[2]?.toLowerCase()) : null,
    maxPrice: max ? toRupees(max[1], max[2]?.toLowerCase()) : null,
  };
}

// ── Category ───────────────────────────────────────

const singular = (word: string) => word.replace(/s$/, "");
const wordPattern = (word: string) => new RegExp(String.raw`\b${singular(word)}s?\b`, "i");

function parseCategories(text: string, categories: StoreVocabulary["categories"]) {
  const parsed = categories.map((c) => {
    const words = c.name.toLowerCase().split(/\s+/);
    return { ...c, head: singular(words[words.length - 1]), qualifiers: words.slice(0, -1) };
  });

  // A one-word category ("Rings") matches its own word; a qualified one ("Engagement Rings",
  // "Bridal Sets") matches its qualifier.
  const byHead = parsed.filter((c) => c.qualifiers.length === 0 && wordPattern(c.head).test(text));
  const byQualifier = parsed.filter((c) => c.qualifiers.some((q) => wordPattern(q).test(text)));

  const matched = new Map(byQualifier.map((c) => [c.id, c]));
  for (const general of byHead) {
    // "engagement ring" → only the qualified category; plain "rings" → every kind of ring.
    if (byQualifier.some((q) => q.head === general.head)) continue;
    matched.set(general.id, general);
    for (const c of parsed) if (c.head === general.head) matched.set(c.id, c);
  }

  const result = [...matched.values()];
  return { categoryIds: result.map((c) => c.id), categoryNames: result.map((c) => c.name) };
}

// ── Material ───────────────────────────────────────

// Longest first, so "rose gold" is consumed before "gold".
const MATERIAL_KEYWORDS: { pattern: RegExp; matches: (m: string) => boolean }[] = [
  { pattern: /\bgold[- ]plated\b/i, matches: (m) => /plated/i.test(m) },
  { pattern: /\brose gold\b/i, matches: (m) => /rose gold/i.test(m) },
  { pattern: /\bwhite gold\b/i, matches: (m) => /white gold/i.test(m) },
  { pattern: /\byellow gold\b/i, matches: (m) => /yellow gold/i.test(m) },
  { pattern: /\b(?:sterling )?silver\b/i, matches: (m) => /silver/i.test(m) && !/plated/i.test(m) },
  { pattern: /\bplatinum\b/i, matches: (m) => /platinum/i.test(m) },
  { pattern: /\bgold\b/i, matches: (m) => /gold/i.test(m) && !/plated/i.test(m) },
  { pattern: /\b(\d{2})\s?(?:k|kt|karat|carat)\b/i, matches: () => true }, // narrowed below
];

function parseMaterials(text: string, materials: string[]): string[] {
  let rest = text;
  const sets: string[][] = [];
  for (const { pattern, matches } of MATERIAL_KEYWORDS) {
    const hit = pattern.exec(rest);
    if (!hit) continue;
    rest = rest.replace(hit[0], " ");
    const karat = pattern.source.includes("karat") ? hit[1] : null;
    sets.push(materials.filter((m) => (karat ? new RegExp(String.raw`\b${karat}k\b`, "i").test(m) : matches(m))));
  }
  if (sets.length === 0) return [];

  // "22k gold" → both must hold; "silver or platinum" → the intersection is empty, take either.
  const intersection = sets.reduce((acc, s) => acc.filter((m) => s.includes(m)));
  return intersection.length > 0 ? intersection : [...new Set(sets.flat())];
}

// ── Stock and sale ─────────────────────────────────

const IN_STOCK = /\b(?:in stock|available|buy (?:it |them )?today|ready to ship|immediately)\b/i;
const ON_SALE = /\b(?:on sale|sale|discount(?:ed|s)?|offers?|deals?)\b/i;

// ── Public API ─────────────────────────────────────

export function parseFilters(message: string, vocab: StoreVocabulary): ProductFilters {
  return {
    ...parseCategories(message, vocab.categories),
    materialNames: parseMaterials(message, vocab.materials),
    ...parsePrice(message),
    inStockOnly: IN_STOCK.test(message),
    onSaleOnly: ON_SALE.test(message),
  };
}

export function hasFilters(f: ProductFilters): boolean {
  return (
    f.categoryIds.length > 0 ||
    f.materialNames.length > 0 ||
    f.minPrice !== null ||
    f.maxPrice !== null ||
    f.inStockOnly ||
    f.onSaleOnly
  );
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** One line the model can read: what the store understood the customer to want. */
export function describeFilters(f: ProductFilters): string {
  const parts: string[] = [];
  if (f.categoryNames.length) parts.push(`category: ${f.categoryNames.join(" or ")}`);
  if (f.materialNames.length) parts.push(`material: ${f.materialNames.join(" or ")}`);
  if (f.minPrice !== null && f.maxPrice !== null) parts.push(`price ${rupees(f.minPrice)}–${rupees(f.maxPrice)}`);
  else if (f.maxPrice !== null) parts.push(`price ≤ ${rupees(f.maxPrice)}`);
  else if (f.minPrice !== null) parts.push(`price ≥ ${rupees(f.minPrice)}`);
  if (f.inStockOnly) parts.push("in stock only");
  if (f.onSaleOnly) parts.push("on sale only");
  return parts.join("; ");
}
