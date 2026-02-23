/**
 * Database Migration Script
 * 
 * Requires DATABASE_URL in .env.local (direct Postgres connection string from
 * Supabase: Settings → Database → Connection string → URI)
 *
 * Usage:
 *   npx tsx src/lib/migrate.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const MIGRATION = `
  -- Drop the hardcoded role check constraint so any role name is allowed
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

  CREATE TABLE IF NOT EXISTS roles (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text UNIQUE NOT NULL,
    description text,
    is_system   boolean DEFAULT false,
    created_at  timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text UNIQUE NOT NULL,
    resource    text NOT NULL,
    action      text NOT NULL,
    description text
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       uuid REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  );
`;

export async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required.\n" +
      "Add it to .env.local — find it in Supabase → Settings → Database → Connection string (URI).",
    );
  }

  const sql = postgres(databaseUrl, {
    ssl: "require",
    max: 1,
    onnotice: () => {}, // suppress "already exists" notices
  });

  try {
    await sql.unsafe(MIGRATION);

    // Tell PostgREST to reload its schema cache so the Supabase JS client
    // can see the newly created tables immediately.
    await sql.unsafe(`SELECT pg_notify('pgrst', 'reload schema')`);

    console.log("✅ Migration complete (roles, permissions, role_permissions)");

    // Give PostgREST ~2s to process the reload notification before we
    // start using the Supabase JS client against the new tables.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } finally {
    await sql.end();
  }
}

// Run directly when called as a script
if (process.argv[1]?.endsWith("migrate.ts") || process.argv[1]?.endsWith("migrate.js")) {
  migrate().catch((err) => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  });
}
