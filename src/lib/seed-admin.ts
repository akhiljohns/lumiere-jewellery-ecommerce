/**
 * Admin Seed Script
 *
 * Seeds the initial master admin user into the database.
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from environment variables.
 *
 * Usage:
 *   npx tsx src/lib/seed-admin.ts
 *
 * Requires a .env.local file with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";

async function seedAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
    console.error(
      "❌ Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const passwordHash = await hash(adminPassword, 12);

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        email: adminEmail,
        password_hash: passwordHash,
        full_name: "Master Admin",
        role: "admin",
        is_active: true,
      },
      { onConflict: "email" },
    )
    .select()
    .single();

  if (error) {
    console.error("❌ Failed to seed admin:", error.message);
    process.exit(1);
  }

  console.log("✅ Admin seeded successfully:");
  console.log(`   Email: ${data.email}`);
  console.log(`   ID:    ${data.id}`);
  console.log(`   Role:  ${data.role}`);
}

seedAdmin();
