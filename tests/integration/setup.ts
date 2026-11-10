import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

// Integration tests write to the database. Refuse anything that is not the local Supabase stack.
for (const name of ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; start the local stack and write .env.local`);
  const host = new URL(value).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`${name} points at ${host}; integration tests only run against a local database`);
  }
}
