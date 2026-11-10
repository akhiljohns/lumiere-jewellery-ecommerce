import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";

// RLS on with no policy: only the service role (which bypasses RLS) reaches these tables.
// The dropped policies had no TO clause, so they covered authenticated as well as anon.

const db = new Client({ connectionString: process.env.DATABASE_URL });

beforeAll(() => db.connect());
afterAll(() => db.end());

const INSERTS: Record<string, string> = {
  chat_conversations: `insert into chat_conversations (session_id) values ('policy-test')`,
  chat_messages: `insert into chat_messages (conversation_id, role, content)
                  values (gen_random_uuid(), 'user', 'policy-test')`,
  product_embeddings: `insert into product_embeddings (product_id, chunk_text, embedding)
                       values (gen_random_uuid(), 'policy-test', array_fill(0, array[768])::vector)`,
};

/** Runs `fn` as `role` inside a transaction that is always rolled back. */
async function asRole<T>(role: string, fn: () => Promise<T>, setup?: string): Promise<T> {
  await db.query("begin");
  try {
    if (setup) await db.query(setup);
    await db.query(`set local role ${role}`);
    return await fn();
  } finally {
    await db.query("rollback");
  }
}

describe.each(["anon", "authenticated"])("as %s", (role) => {
  describe.each(Object.keys(INSERTS))("%s", (table) => {
    // A row the service role wrote, so "no rows" means hidden, not empty.
    const seed = table === "chat_conversations" ? INSERTS.chat_conversations : undefined;

    it("sees no rows", async () => {
      const read = await asRole(role, () => db.query(`select count(*)::int as n from ${table}`), seed);
      expect(read.rows[0].n).toBe(0);
    });

    it("cannot update or delete", async () => {
      const [update, del] = await asRole(
        role,
        async () => [
          await db.query(`update ${table} set created_at = now()`),
          await db.query(`delete from ${table}`),
        ],
        seed,
      );
      expect(update.rowCount).toBe(0);
      expect(del.rowCount).toBe(0);
    });

    it("cannot insert", async () => {
      // 42501 is the row-level security refusal, not a foreign-key or type error.
      await expect(asRole(role, () => db.query(INSERTS[table]))).rejects.toMatchObject({ code: "42501" });
    });
  });
});
