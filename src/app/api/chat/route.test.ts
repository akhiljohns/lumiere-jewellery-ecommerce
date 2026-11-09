import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/chat", () => ({
  chat: vi.fn(async () => ({ message: "ok", product_ids: [], conversation_id: "c1" })),
}));

const { POST } = await import("./route");

let ip = 0;
beforeEach(() => {
  ip++; // a fresh client address per test, so the in-memory limiter starts empty
});

function send(address: string) {
  return POST(
    new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": address },
      body: JSON.stringify({ message: "hello" }),
    }),
  );
}

describe("POST /api/chat rate limit (R12)", () => {
  it("allows ten messages a minute and refuses the eleventh", async () => {
    const address = `10.0.0.${ip}`;
    for (let i = 0; i < 10; i++) {
      expect((await send(address)).status).toBe(200);
    }
    const refused = await send(address);
    expect(refused.status).toBe(429);
    expect(refused.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect((await refused.json()).error).toMatch(/sending messages quickly/i);
  });

  it("counts each client separately", async () => {
    const first = `10.0.1.${ip}`;
    for (let i = 0; i < 11; i++) await send(first);
    expect((await send(`10.0.2.${ip}`)).status).toBe(200);
  });
});
