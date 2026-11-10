import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "pg";

// Gemini is replaced by a fake; the database is the real local one.
// Embeddings always fail here, so retrieval runs on full text (R7) and the
// answer model's behaviour is whatever each test sets.

const generateContent = vi.fn();

vi.mock("@google/genai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@google/genai")>()),
  GoogleGenAI: class {
    models = {
      generateContent,
      embedContent: vi.fn(async () => {
        throw Object.assign(new Error("embedding quota"), { status: 429 });
      }),
    };
  },
}));

const { chat } = await import("@/lib/chat");

const SESSION = "fallback-test";
const quota = () => Object.assign(new Error("quota"), { status: 429 });
const busy = () => Object.assign(new Error("high demand"), { status: 503 });

// chat() reads through the service-role HTTP client, so the fixture has to be committed,
// not inserted in a rolled-back transaction. "Zircotest" keeps it from matching real data.
const FIXTURE = { name: "Zircotest Fallback Band", slug: "zircotest-fallback-band" };
const QUESTION = "zircotest fallback band";

async function withDb(fn: (db: Client) => Promise<unknown>) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await fn(db);
  } finally {
    await db.end();
  }
}

beforeAll(() =>
  withDb(async (db) => {
    await db.query(`delete from products where slug = $1`, [FIXTURE.slug]);
    await db.query(
      `insert into products (name, slug, price, material, stock) values ($1, $2, 2500, '925 Sterling Silver', 7)`,
      [FIXTURE.name, FIXTURE.slug],
    );
  }),
);

beforeEach(() => {
  generateContent.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() =>
  withDb(async (db) => {
    await db.query(`delete from chat_conversations where session_id = $1`, [SESSION]);
    await db.query(`delete from products where slug = $1`, [FIXTURE.slug]);
  }),
);

describe("chat when Gemini fails (R10, R11)", () => {
  it("answers a 429 with the matched products instead of throwing", async () => {
    generateContent.mockRejectedValue(quota());

    const result = await chat({ message: QUESTION, session_id: SESSION });

    expect(result.fallback).toBe(true);
    expect(result.message).toContain(FIXTURE.name);
    expect(result.message).toContain(`/products/${FIXTURE.slug}`);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("retries a 503 once and returns the model's answer", async () => {
    generateContent.mockRejectedValueOnce(busy()).mockResolvedValueOnce({ text: "Here you go." });

    const result = await chat({ message: QUESTION, session_id: SESSION });

    expect(result.message).toBe("Here you go.");
    expect(result.fallback).toBeFalsy();
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("falls back after a second 503", async () => {
    generateContent.mockRejectedValue(busy());

    const result = await chat({ message: QUESTION, session_id: SESSION });

    expect(result.fallback).toBe(true);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("says nothing matches when the filters excluded everything", async () => {
    generateContent.mockRejectedValue(quota());

    const result = await chat({ message: "show me rings under 100", session_id: SESSION });

    expect(result.message).toMatch(/Nothing in the catalogue matches: .*price ≤ ₹100/);
    expect(result.message).not.toContain("/products/");
  });

  it("does not pass featured items off as matches", async () => {
    generateContent.mockRejectedValue(quota());

    const result = await chat({ message: "hello", session_id: SESSION });

    expect(result.fallback).toBe(true);
    expect(result.message).not.toContain("/products/");
  });

  it("keeps the fallback in the conversation history", async () => {
    generateContent.mockRejectedValue(quota());

    const result = await chat({ message: QUESTION, session_id: SESSION });
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    const { rows } = await db.query(
      `select role, content from chat_messages where conversation_id = $1 order by created_at`,
      [result.conversation_id],
    );
    await db.end();

    expect(rows.map((r) => r.role)).toEqual(["user", "assistant"]);
    expect(rows[1].content).toBe(result.message);
  });
});
