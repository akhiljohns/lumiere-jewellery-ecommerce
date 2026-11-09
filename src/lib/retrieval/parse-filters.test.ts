import { describe, expect, it } from "vitest";
import { describeFilters, hasFilters, parseFilters, type StoreVocabulary } from "./parse-filters";

const vocab: StoreVocabulary = {
  categories: [
    { id: "c-rings", name: "Rings" },
    { id: "c-engagement", name: "Engagement Rings" },
    { id: "c-necklaces", name: "Necklaces" },
    { id: "c-earrings", name: "Earrings" },
    { id: "c-bangles", name: "Bangles" },
    { id: "c-chains", name: "Chains" },
    { id: "c-bridal", name: "Bridal Sets" },
  ],
  materials: [
    "22k Yellow Gold",
    "18k Yellow Gold",
    "18k Rose Gold",
    "18k White Gold",
    "925 Sterling Silver",
    "Platinum 950",
    "Gold-plated Silver",
  ],
};

const parse = (message: string) => parseFilters(message, vocab);

describe("price filters (R1)", () => {
  it.each([
    ["show me rings under 5000", null, 5000],
    ["anything below ₹5k?", null, 5000],
    ["necklace under 1.5 lakh", null, 150000],
    ["earrings less than Rs. 3,000", null, 3000],
    ["between 20,000 and 50,000", 20000, 50000],
    ["from 10k to 20k", 10000, 20000],
    ["bangles above 1 lakh", 100000, null],
    ["gift for my wife under 10k", null, 10000],
  ])("%s", (message, min, max) => {
    const f = parse(message);
    expect(f.minPrice).toBe(min);
    expect(f.maxPrice).toBe(max);
  });

  it("ignores a number with no price word", () => {
    const f = parse("5000 rings");
    expect(f.minPrice).toBeNull();
    expect(f.maxPrice).toBeNull();
  });

  it("does not read a karat as a price", () => {
    const f = parse("22k gold chain");
    expect(f.minPrice).toBeNull();
    expect(f.maxPrice).toBeNull();
  });

  it("swaps a reversed range", () => {
    const f = parse("between 50000 and 20000");
    expect([f.minPrice, f.maxPrice]).toEqual([20000, 50000]);
  });
});

describe("category filters (R2)", () => {
  it("'rings' includes engagement rings", () => {
    expect(parse("show me rings").categoryIds.sort()).toEqual(["c-engagement", "c-rings"]);
  });

  it("'engagement ring' narrows to engagement rings", () => {
    expect(parse("an engagement ring for my girlfriend").categoryIds).toEqual(["c-engagement"]);
  });

  it("does not match 'rings' inside 'earrings'", () => {
    expect(parse("silver earrings please").categoryIds).toEqual(["c-earrings"]);
  });

  it("matches a bridal set by its first word", () => {
    expect(parse("bridal jewellery for a Kerala wedding").categoryIds).toEqual(["c-bridal"]);
  });

  it("keeps two different categories", () => {
    expect(parse("a chain and a necklace").categoryIds.sort()).toEqual(["c-chains", "c-necklaces"]);
  });

  it("no category word, no filter", () => {
    expect(parse("something for my mother's 60th birthday").categoryIds).toEqual([]);
  });
});

describe("material filters (R2)", () => {
  it("'silver' excludes gold-plated silver", () => {
    expect(parse("silver earrings").materialNames).toEqual(["925 Sterling Silver"]);
  });

  it("'gold' includes rose and white gold but not plated", () => {
    expect(parse("gold bangles").materialNames.sort()).toEqual([
      "18k Rose Gold",
      "18k White Gold",
      "18k Yellow Gold",
      "22k Yellow Gold",
    ]);
  });

  it("'rose gold' is one material, not all gold", () => {
    expect(parse("anything in rose gold?").materialNames).toEqual(["18k Rose Gold"]);
  });

  it("'22k gold' intersects karat and metal", () => {
    expect(parse("22k gold chain").materialNames).toEqual(["22k Yellow Gold"]);
  });

  it("'gold plated' selects plated only", () => {
    expect(parse("gold plated earrings").materialNames).toEqual(["Gold-plated Silver"]);
  });

  it("'silver or gold' falls back to the union", () => {
    expect(parse("silver or platinum rings").materialNames.sort()).toEqual([
      "925 Sterling Silver",
      "Platinum 950",
    ]);
  });
});

describe("stock and sale filters (R3)", () => {
  it.each(["which rings can I buy today?", "is it in stock", "what's available in silver"])(
    "%s → in stock only",
    (message) => expect(parse(message).inStockOnly).toBe(true),
  );

  it.each(["what's on sale?", "any discount on chains", "show me offers"])(
    "%s → on sale only",
    (message) => expect(parse(message).onSaleOnly).toBe(true),
  );
});

describe("hasFilters and describeFilters", () => {
  it("plain question has no filters", () => {
    expect(hasFilters(parse("hello"))).toBe(false);
  });

  it("describes what was understood", () => {
    const text = describeFilters(parse("silver rings under 5000 in stock"));
    expect(text).toContain("Rings");
    expect(text).toContain("925 Sterling Silver");
    expect(text).toContain("≤ ₹5,000");
    expect(text).toContain("in stock");
  });
});
