import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaginationMeta } from "@/lib/utils";
import type { RoleWithPermissions, PaginatedRoles } from "@/features/roles/types";

// ── List ───────────────────────────────────────────

export async function getRoles(): Promise<PaginatedRoles> {
  const supabase = createAdminClient();

  const { data, count, error } = await supabase
    .from("roles")
    .select(
      `*, role_permissions ( permissions ( name ) )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const roles: RoleWithPermissions[] = (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    is_system: r.is_system,
    created_at: r.created_at,
    permissions: (r.role_permissions ?? []).map(
      (rp: any) => rp.permissions?.name,
    ).filter(Boolean),
  }));

  return {
    data: roles,
    pagination: buildPaginationMeta(1, count ?? roles.length, count ?? roles.length),
  };
}

// ── Get Single ────────────────────────────────────

export async function getRoleById(id: string): Promise<RoleWithPermissions | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("roles")
    .select(`*, role_permissions ( permissions ( name ) )`)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: (data as any).id,
    name: (data as any).name,
    description: (data as any).description,
    is_system: (data as any).is_system,
    created_at: (data as any).created_at,
    permissions: ((data as any).role_permissions ?? []).map(
      (rp: any) => rp.permissions?.name,
    ).filter(Boolean),
  };
}

// ── Create ────────────────────────────────────────

export async function createRole(input: {
  name: string;
  description?: string | null;
  permissions: string[];
}): Promise<RoleWithPermissions> {
  const supabase = createAdminClient();

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .insert({
      name: input.name,
      description: input.description ?? null,
      is_system: false,
    })
    .select()
    .single();

  if (roleError) {
    if (roleError.code === "23505") {
      throw new Error("A role with this name already exists");
    }
    throw new Error(roleError.message);
  }

  if (input.permissions.length > 0) {
    await syncRolePermissions((role as any).id, input.permissions, supabase);
  }

  return getRoleById((role as any).id) as Promise<RoleWithPermissions>;
}

// ── Update ────────────────────────────────────────

export async function updateRole(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    permissions?: string[];
  },
): Promise<RoleWithPermissions> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from("roles")
      .update(updateData)
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        throw new Error("A role with this name already exists");
      }
      throw new Error(error.message);
    }
  }

  if (input.permissions !== undefined) {
    await syncRolePermissions(id, input.permissions, supabase);
  }

  return getRoleById(id) as Promise<RoleWithPermissions>;
}

// ── Delete ────────────────────────────────────────

export async function deleteRole(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("roles").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

// ── Helpers ───────────────────────────────────────

async function syncRolePermissions(
  roleId: string,
  permissionNames: string[],
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  // Fetch permission IDs for the given names
  const { data: perms, error: permError } = await supabase
    .from("permissions")
    .select("id, name")
    .in("name", permissionNames);

  if (permError) throw new Error(permError.message);

  const permIds = (perms ?? []).map((p: any) => p.id);

  // Delete existing role_permissions for this role
  await supabase.from("role_permissions").delete().eq("role_id", roleId);

  // Insert new ones
  if (permIds.length > 0) {
    const rows = permIds.map((permission_id: string) => ({
      role_id: roleId,
      permission_id,
    }));

    const { error: insertError } = await supabase
      .from("role_permissions")
      .insert(rows);

    if (insertError) throw new Error(insertError.message);
  }
}
