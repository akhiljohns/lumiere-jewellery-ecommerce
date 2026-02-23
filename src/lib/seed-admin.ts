/**
 * Admin Seed Script
 *
 * 1. Runs the database migration (creates tables if they don't exist)
 * 2. Seeds permissions, roles, role_permissions
 * 3. Upserts the master admin user with super_admin role
 *
 * Usage:
 *   npx tsx src/lib/seed-admin.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   ADMIN_EMAIL, ADMIN_PASSWORD,
 *   DATABASE_URL  ← Supabase → Settings → Database → Connection string (URI)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";
import { migrate } from "./migrate";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from "./permissions";

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

  // ── 0. Run migration first ────────────────────────
  console.log("Running migrations...");
  await migrate();

  // ── 1. Seed permissions ───────────────────────────
  console.log("\nSeeding permissions...");
  const permissionRows = ALL_PERMISSIONS.map((name) => {
    const [resource, action] = name.split(".");
    return { name, resource, action };
  });

  const { error: permError } = await supabase
    .from("permissions")
    .upsert(permissionRows, { onConflict: "name" });

  if (permError) {
    console.error("❌ Failed to seed permissions:", permError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${permissionRows.length} permissions seeded`);

  // Fetch permission id map
  const { data: permData, error: permFetchError } = await supabase
    .from("permissions")
    .select("id, name");

  if (permFetchError || !permData) {
    console.error("❌ Failed to fetch permissions:", permFetchError?.message);
    process.exit(1);
  }
  const permMap: Record<string, string> = {};
  for (const p of permData) permMap[p.name] = p.id;

  // ── 2. Seed roles ─────────────────────────────────
  console.log("\nSeeding roles...");
  const roleRows = [
    {
      name: "super_admin",
      description: "Full access, bypasses all permission checks",
      is_system: true,
    },
    {
      name: "admin",
      description: "Full admin access via permissions",
      is_system: true,
    },
    {
      name: "product_manager",
      description: "Manage products and view dashboard",
      is_system: false,
    },
    {
      name: "viewer",
      description: "Read-only access",
      is_system: false,
    },
  ];

  const { error: roleError } = await supabase
    .from("roles")
    .upsert(roleRows, { onConflict: "name" });

  if (roleError) {
    console.error("❌ Failed to seed roles:", roleError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${roleRows.length} roles seeded`);

  // Fetch role id map
  const { data: roleData, error: roleFetchError } = await supabase
    .from("roles")
    .select("id, name");

  if (roleFetchError || !roleData) {
    console.error("❌ Failed to fetch roles:", roleFetchError?.message);
    process.exit(1);
  }
  const roleMap: Record<string, string> = {};
  for (const r of roleData) roleMap[r.name] = r.id;

  // ── 3. Seed role_permissions ──────────────────────
  console.log("\nSeeding role_permissions...");
  const rpRows: { role_id: string; permission_id: string }[] = [];
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;
    for (const perm of perms) {
      const permId = permMap[perm];
      if (!permId) continue;
      rpRows.push({ role_id: roleId, permission_id: permId });
    }
  }

  // Delete existing mappings and re-insert (clean sync)
  for (const roleId of Object.values(roleMap)) {
    await supabase.from("role_permissions").delete().eq("role_id", roleId);
  }

  const { error: rpError } = await supabase
    .from("role_permissions")
    .insert(rpRows);

  if (rpError) {
    console.error("❌ Failed to seed role_permissions:", rpError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${rpRows.length} role_permissions seeded`);

  // ── 4. Seed master admin user ─────────────────────
  console.log("\nSeeding master admin user...");
  const passwordHash = await hash(adminPassword, 12);

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        email: adminEmail,
        password_hash: passwordHash,
        full_name: "Master Admin",
        role: "super_admin",
        is_active: true,
      },
      { onConflict: "email" },
    )
    .select()
    .single();

  if (error) {
    console.error("❌ Failed to seed admin user:", error.message);
    process.exit(1);
  }

  console.log("\n✅ Seed complete!");
  console.log(`   Email: ${data.email}`);
  console.log(`   ID:    ${data.id}`);
  console.log(`   Role:  ${data.role}`);
  console.log("\n   Log out and log back in for the new role to take effect.");
}

seedAdmin();
