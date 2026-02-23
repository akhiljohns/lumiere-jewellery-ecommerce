import { createAdminClient } from "@/lib/supabase/admin";
import { compare, hash } from "bcryptjs";
import type { User } from "@/lib/supabase/types";

/**
 * Omit sensitive fields from user before sending to client.
 */
export function sanitizeUser(user: User) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export type SafeUser = ReturnType<typeof sanitizeUser>;

/**
 * Find a user by email and verify password.
 * Returns the sanitized user on success, null on failure.
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<SafeUser | null> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) return null;
  if (!user.is_active) return null;
  if (user.role === "customer") return null;

  const isValid = await compare(password, user.password_hash);
  if (!isValid) return null;

  return sanitizeUser(user);
}

/**
 * Get a user by ID. Returns sanitized user or null.
 */
export async function getUserById(id: string): Promise<SafeUser | null> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !user) return null;

  return sanitizeUser(user);
}

/**
 * Create a new user with hashed password.
 */
export async function createUser(input: {
  email: string;
  password: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
}): Promise<SafeUser> {
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

  if (error) throw new Error(error.message);

  return sanitizeUser(data);
}
