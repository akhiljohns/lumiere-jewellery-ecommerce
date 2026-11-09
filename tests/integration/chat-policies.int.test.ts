import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";

// RLS on with no policy: only the service role (which bypasses RLS) reaches these tables.

const db = new Client({ connectionString: process.env.DATABASE_URL });

beforeAll(() => db.connect());
afterAll(() => db.end());

describe.each(["chat_conversations", "chat_messages", "product_embeddings"])("%s", (table) => {
  it("anon sees no rows and cannot delete", async () => {
    await db.query("begin");
    try {
      if (table === "chat_conversations") {
        await db.query(`insert into chat_conversations (session_id) values ('policy-test')`);
      }
      await db.query("set local role anon");
      const read = await db.query(`select count(*)::int as n from ${table}`);
      expect(read.rows[0].n).toBe(0);
      const del = await db.query(`delete from ${table}`);
      expect(del.rowCount).toBe(0);
    } finally {
      await db.query("rollback");
    }
  });
});
