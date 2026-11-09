import { describe, expect, it } from "vitest";
import { buildFallbackMessage, isRetryableModelError } from "./chat-fallback";

const ring = { name: "Simple Silver Band", price: 2500, slug: "simple-silver-band" };
const trio = { name: "Gold-plated Stackable Trio", price: 2900, slug: "gold-plated-stackable-trio" };

describe("buildFallbackMessage (R10)", () => {
  it("lists the matched products with price and link", () => {
    const text = buildFallbackMessage({ matched: [ring, trio] });
    expect(text).toContain("busy");
    expect(text).toContain("Simple Silver Band — ₹2,500 — /products/simple-silver-band");
    expect(text).toContain("Gold-plated Stackable Trio — ₹2,900 — /products/gold-plated-stackable-trio");
  });

  it("says nothing matches when the filters excluded everything", () => {
    const text = buildFallbackMessage({ matched: [], unmatchedFilters: "category: Rings; price ≤ ₹100" });
    expect(text).toContain("busy");
    expect(text).toContain("Nothing in the catalogue matches: category: Rings; price ≤ ₹100");
    expect(text).not.toContain("/products/");
  });

  it("only asks to try again when there is nothing to show", () => {
    const text = buildFallbackMessage({ matched: [] });
    expect(text).toContain("try again");
    expect(text).not.toContain("/products/");
  });
});

describe("isRetryableModelError (R11)", () => {
  it.each([
    [{ status: 503 }, true],
    [{ status: 500 }, true],
    [{ status: 429 }, false],
    [{ status: 400 }, false],
    [new Error("network down"), false],
  ])("%o → %s", (err, expected) => {
    expect(isRetryableModelError(err)).toBe(expected);
  });
});
