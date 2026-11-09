import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { getConversationHistory } from "@/lib/chat";

// getConversationHistory goes through the Supabase REST API, so these rows are committed
// and removed afterwards instead of living in a rolled-back transaction.

const db = new Client({ connectionString: process.env.DATABASE_URL });
let conversationId = "";

beforeAll(async () => {
  await db.connect();
  const { rows } = await db.query(
    `insert into chat_conversations (session_id) values ('history-test') returning id`,
  );
  conversationId = rows[0].id;
  await db.query(
    `insert into chat_messages (conversation_id, role, content, created_at)
     select $1, case when n % 2 = 1 then 'user' else 'assistant' end, 'message ' || n,
            now() - interval '1 hour' + n * interval '1 minute'
     from generate_series(1, 12) as n`,
    [conversationId],
  );
});

afterAll(async () => {
  await db.query(`delete from chat_conversations where id = $1`, [conversationId]);
  await db.end();
});

describe("getConversationHistory (R8)", () => {
  it("returns the latest ten messages, oldest first", async () => {
    const history = await getConversationHistory(conversationId, 10);
    expect(history.map((m) => m.content)).toEqual(
      Array.from({ length: 10 }, (_, i) => `message ${i + 3}`),
    );
  });
});
