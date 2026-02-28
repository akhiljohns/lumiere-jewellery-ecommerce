import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaginationMeta } from "@/lib/utils";
import { hash } from "bcryptjs";
import type { User } from "@/lib/supabase/types";
import type {
  UserCreateInput,
  UserUpdateInput,
  PaginationInput,
} from "@/lib/validators";

// ── Types ──────────────────────────────────────────

/** User without sensitive fields — safe for API responses. */
export type SafeUser = Omit<
  User,
  | "password_hash"
  | "verification_token"
  | "verification_token_expires"
  | "reset_token"
  | "reset_token_expires"
>;

export interface PaginatedUsers {
  data: SafeUser[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

/** Strip sensitive fields from a user row. */
function sanitize(user: User): SafeUser {
  const {
    password_hash,
    verification_token,
    verification_token_expires,
    reset_token,
    reset_token_expires,
    ...safe
  } = user;
  return safe;
}

// ── List ───────────────────────────────────────────

export async function getUsers(
  query: PaginationInput,
): Promise<PaginatedUsers> {
  const supabase = createAdminClient();
  const { page, limit, search, sort, order } = query;
  const offset = (page - 1) * limit;

  let qb = supabase.from("users").select("*", { count: "exact" });

  if (search) {
    qb = qb.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  qb = qb
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await qb;

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(sanitize),
    pagination: buildPaginationMeta(page, limit, count ?? 0),
  };
}

// ── Get Single ────────────────────────────────────

export async function getUserById(id: string): Promise<SafeUser | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return sanitize(data);
}

// ── Create ────────────────────────────────────────

export async function createUser(input: UserCreateInput): Promise<SafeUser> {
  const supabase = createAdminClient();

  const passwordHash = await hash(input.password, 12);

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: input.email,
      password_hash: passwordHash,
      full_name: input.full_name ?? null,
      phone: input.phone ?? null,
      role: input.role ?? "customer",
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A user with this email already exists");
    }
    throw new Error(error.message);
  }

  return sanitize(data);
}

// ── Update ────────────────────────────────────────

export async function updateUser(
  id: string,
  input: UserUpdateInput,
): Promise<SafeUser> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {};

  if (input.email !== undefined) updateData.email = input.email;
  if (input.full_name !== undefined) updateData.full_name = input.full_name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  // Hash new password if provided
  if (input.password) {
    updateData.password_hash = await hash(input.password, 12);
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A user with this email already exists");
    }
    throw new Error(error.message);
  }

  return sanitize(data);
}

// ── Delete ────────────────────────────────────────

export async function deleteUser(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
