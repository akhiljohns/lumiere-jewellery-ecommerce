import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Client } from "pg";

// Every test runs in a transaction that is rolled back, so fixtures never persist.
// Query words use the made-up token "zircotest" so full-text search only hits these fixtures,
// and vectors are one-hot so semantic search only hits them too.

const db = new Client({ connectionString: process.env.DATABASE_URL });

/** A 768-d unit vector pointing mostly at `axis`, with an optional tilt towards `toward`. */
function vec(axis: number, toward?: number, tilt = 0): string {
  const v = new Array<number>(768).fill(0);
  v[axis] = 1;
  if (toward !== undefined) v[toward] = tilt;
  const norm = Math.hypot(...v);
  return `[${v.map((x) => x / norm).join(",")}]`;
}

interface Fixture {
  slug: string;
  name: string;
  description?: string;
  price: number;
  compare_price?: number | null;
  material?: string;
  stock?: number;
  is_active?: boolean;
  category: "ring" | "neck";
  embedding?: string;
}

let ringCat = "";
let neckCat = "";

async function addProduct(p: Fixture): Promise<string> {
  const { rows } = await db.query(
    `insert into products (name, slug, description, price, compare_price, material, stock, is_active, category_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
    [
      p.name,
      p.slug,
      p.description ?? null,
      p.price,
      p.compare_price ?? null,
      p.material ?? "Test Metal",
      p.stock ?? 5,
      p.is_active ?? true,
      p.category === "ring" ? ringCat : neckCat,
    ],
  );
  const id = rows[0].id as string;
  if (p.embedding) {
    await db.query(
      `insert into product_embeddings (product_id, chunk_text, embedding) values ($1, $2, $3)`,
      [id, p.name, p.embedding],
    );
  }
  return id;
}

interface SearchArgs {
  query_text: string;
  query_embedding?: string | null;
  category_ids?: string[] | null;
  material_names?: string[] | null;
  min_price?: number | null;
  max_price?: number | null;
  in_stock_only?: boolean;
  on_sale_only?: boolean;
  match_count?: number;
  min_similarity?: number;
}

async function search(args: SearchArgs) {
  const { rows } = await db.query(
    `select * from search_products_hybrid(
       query_text => $1, query_embedding => $2::vector, category_ids => $3::uuid[],
       material_names => $4::text[], min_price => $5, max_price => $6,
       in_stock_only => $7, on_sale_only => $8, match_count => $9, min_similarity => $10)`,
    [
      args.query_text,
      args.query_embedding ?? null,
      args.category_ids ?? null,
      args.material_names ?? null,
      args.min_price ?? null,
      args.max_price ?? null,
      args.in_stock_only ?? false,
      args.on_sale_only ?? false,
      args.match_count ?? 10,
      args.min_similarity ?? 0.9,
    ],
  );
  return rows as { slug: string; text_rank: number | null; semantic_rank: number | null; category_name: string }[];
}

const slugs = (rows: { slug: string }[]) => rows.map((r) => r.slug);

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  await db.query("begin");
  const { rows } = await db.query(
    `insert into categories (name, slug) values ('Zirco Rings','zirco-rings'), ('Zirco Necklaces','zirco-necklaces')
     returning id, slug`,
  );
  ringCat = rows.find((r) => r.slug === "zirco-rings").id;
  neckCat = rows.find((r) => r.slug === "zirco-necklaces").id;
});

afterEach(async () => {
  await db.query("rollback");
});

describe("search_products_hybrid (R4–R6)", () => {
  it("applies the price, category and material filters before ranking", async () => {
    await addProduct({ slug: "t-cheap-ring", name: "Zircotest Cheap Ring", price: 2000, material: "Silver", category: "ring" });
    await addProduct({ slug: "t-dear-ring", name: "Zircotest Dear Ring", price: 9000, material: "Silver", category: "ring" });
    await addProduct({ slug: "t-cheap-neck", name: "Zircotest Cheap Necklace", price: 1500, material: "Silver", category: "neck" });
    await addProduct({ slug: "t-gold-ring", name: "Zircotest Gold Ring", price: 3000, material: "Gold", category: "ring" });

    const rows = await search({
      query_text: "zircotest",
      category_ids: [ringCat],
      material_names: ["Silver"],
      max_price: 5000,
    });

    expect(slugs(rows)).toEqual(["t-cheap-ring"]);
    expect(rows[0].category_name).toBe("Zirco Rings");
  });

  it("in_stock_only drops sold-out items and on_sale_only needs a higher compare price", async () => {
    await addProduct({ slug: "t-sold-out", name: "Zircotest Sold Out", price: 1000, stock: 0, category: "ring" });
    await addProduct({ slug: "t-on-sale", name: "Zircotest On Sale", price: 1000, compare_price: 1500, category: "ring" });
    await addProduct({ slug: "t-equal-compare", name: "Zircotest Equal", price: 1000, compare_price: 1000, category: "ring" });

    const ours = { query_text: "zircotest", category_ids: [ringCat] };
    expect(slugs(await search({ ...ours, in_stock_only: true })).sort()).toEqual([
      "t-equal-compare",
      "t-on-sale",
    ]);
    expect(slugs(await search({ ...ours, on_sale_only: true }))).toEqual(["t-on-sale"]);
  });

  it("never returns inactive products", async () => {
    await addProduct({ slug: "t-hidden", name: "Zircotest Hidden", price: 1000, is_active: false, category: "ring", embedding: vec(5) });
    expect(await search({ query_text: "zircotest", query_embedding: vec(5) })).toEqual([]);
  });

  it("ranks a product found by both words and meaning above one found by either", async () => {
    await addProduct({ slug: "t-both", name: "Zircotest Both", price: 1000, category: "ring", embedding: vec(10) });
    await addProduct({ slug: "t-words", name: "Zircotest Words", price: 1000, category: "ring", embedding: vec(20) });
    await addProduct({ slug: "t-meaning", name: "Plain Meaning", price: 1000, category: "ring", embedding: vec(10, 11, 0.2) });

    const rows = await search({ query_text: "zircotest", query_embedding: vec(10) });

    expect(rows[0].slug).toBe("t-both");
    expect(slugs(rows).sort()).toEqual(["t-both", "t-meaning", "t-words"]);
  });

  it("finds a product by meaning when no word matches", async () => {
    await addProduct({ slug: "t-semantic", name: "Plain Name", price: 1000, category: "neck", embedding: vec(30) });
    const rows = await search({ query_text: "qwzx vlorp", query_embedding: vec(30) });
    expect(slugs(rows)).toEqual(["t-semantic"]);
    expect(rows[0].text_rank).toBeNull();
  });

  it("ignores semantic neighbours below min_similarity", async () => {
    await addProduct({ slug: "t-far", name: "Plain Far", price: 1000, category: "neck", embedding: vec(40) });
    expect(await search({ query_text: "unrelated words", query_embedding: vec(41) })).toEqual([]);
  });

  it("still works without an embedding (R7: keyword only)", async () => {
    await addProduct({ slug: "t-keyword", name: "Zircotest Keyword", price: 1000, category: "ring", embedding: vec(50) });
    const rows = await search({ query_text: "zircotest", query_embedding: null });
    expect(slugs(rows)).toEqual(["t-keyword"]);
    expect(rows[0].semantic_rank).toBeNull();
  });

  it("returns products that satisfy the filters even when no word or meaning matches", async () => {
    await addProduct({ slug: "t-filter-only", name: "Plain Filter", price: 2500, category: "ring" });
    const rows = await search({ query_text: "show me", category_ids: [ringCat], max_price: 5000 });
    expect(slugs(rows)).toEqual(["t-filter-only"]);
  });

  it("returns nothing when the filters exclude everything (R5)", async () => {
    await addProduct({ slug: "t-dear", name: "Zircotest Dear", price: 9000, category: "ring" });
    expect(await search({ query_text: "zircotest", category_ids: [ringCat], max_price: 100 })).toEqual([]);
  });

  it("returns nothing for small talk with no filters (R6: the app pads instead)", async () => {
    await addProduct({ slug: "t-any", name: "Zircotest Any", price: 1000, category: "ring", embedding: vec(60) });
    expect(await search({ query_text: "hello there", query_embedding: vec(61) })).toEqual([]);
  });

  it("is not callable by the anon role", async () => {
    await db.query("set local role anon");
    await expect(search({ query_text: "zircotest" })).rejects.toThrow(/permission denied/);
  });
});
