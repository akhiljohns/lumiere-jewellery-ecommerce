import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "@/lib/permissions";

/**
 * Resolve all permissions for a given role name.
 * Returns ALL_PERMISSIONS for super_admin (bypass).
 */
export async function getUserPermissions(role: string): Promise<string[]> {
  if (role === SUPER_ADMIN_ROLE) {
    return ALL_PERMISSIONS;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("roles")
    .select(
      `
      role_permissions (
        permissions ( name )
      )
    `,
    )
    .eq("name", role)
    .single();

  if (error || !data) return [];

  const perms: string[] = [];
  for (const rp of (data as any).role_permissions ?? []) {
    const name = rp.permissions?.name;
    if (name) perms.push(name);
  }

  return perms;
}
