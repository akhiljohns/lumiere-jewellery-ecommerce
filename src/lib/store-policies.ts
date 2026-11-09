// ── The store's stated policies ────────────────────
//
// One source for the homepage features strip and the shopping assistant, so the two can't
// disagree. Change a policy here and both follow.
// Free shipping matches checkout: place_order never adds a shipping fee.

export const STORE_POLICIES = [
  {
    id: "warranty",
    title: "Lifetime Warranty",
    description: "We stand behind the quality of every piece we create",
  },
  {
    id: "shipping",
    title: "Free Shipping",
    description: "Complimentary shipping on all orders, fully insured",
  },
  {
    id: "returns",
    title: "30-Day Returns",
    description: "Easy returns within 30 days, no questions asked",
  },
] as const;

export type StorePolicyId = (typeof STORE_POLICIES)[number]["id"];

/** The policies as prompt lines: "Title: description". */
export function formatPoliciesForPrompt(): string {
  return STORE_POLICIES.map((p) => `- ${p.title}: ${p.description}`).join("\n");
}
