import { afterAll, describe, expect, it, vi } from "vitest";
import { Client } from "pg";

// Captures the system prompt sent to Gemini; the database is the real local one.

const generateContent = vi.fn(async () => ({ text: "ok" }));

vi.mock("@google/genai", () => ({
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
const { STORE_POLICIES } = await import("@/lib/store-policies");

const SESSION = "prompt-test";

afterAll(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`delete from chat_conversations where session_id = $1`, [SESSION]);
  await db.end();
});

describe("store policies in the prompt", () => {
  it("gives the model the same policy text the homepage shows", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await chat({ message: "what's your return policy?", session_id: SESSION });

    const call = generateContent.mock.calls[0] as unknown as [{ config: { systemInstruction: string } }];
    const prompt = call[0].config.systemInstruction;

    for (const policy of STORE_POLICIES) {
      expect(prompt).toContain(`${policy.title}: ${policy.description}`);
    }
    expect(prompt).toMatch(/hallmarking/i); // still listed as something it cannot confirm
  });
});
