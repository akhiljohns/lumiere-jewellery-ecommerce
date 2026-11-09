// ── What the assistant says when the answer model is unavailable ──

interface FallbackProduct {
  name: string;
  price: number;
  slug: string;
}

const BUSY = "Our assistant is busy right now.";

/**
 * A plain answer built only from retrieved data, so nothing can be invented.
 * Featured padding is never passed in here: only real matches are listed.
 */
export function buildFallbackMessage(input: {
  matched: FallbackProduct[];
  unmatchedFilters?: string;
}): string {
  if (input.matched.length > 0) {
    const lines = input.matched.map(
      (p) => `- ${p.name} — ₹${p.price.toLocaleString("en-IN")} — /products/${p.slug}`,
    );
    return `${BUSY} These products match your question:\n${lines.join("\n")}`;
  }

  if (input.unmatchedFilters) {
    return `${BUSY} Nothing in the catalogue matches: ${input.unmatchedFilters}. Try a wider search in a minute.`;
  }

  return `${BUSY} Please try again in a minute.`;
}

/** 500 and 503 are usually momentary; 429 means quota and its retry delay is close to a minute. */
export function isRetryableModelError(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  return status === 500 || status === 503;
}
