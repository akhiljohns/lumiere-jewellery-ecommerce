import { createAdminClient } from "@/lib/supabase/admin";
import { compare, hash } from "bcryptjs";
import crypto from "crypto";
import type { User } from "@/lib/supabase/types";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email";

export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Please verify your email address before logging in");
    this.name = "EmailNotVerifiedError";
  }
}

/** Token expiry durations in milliseconds. */
const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/** Sensitive fields stripped from customer responses. */
type SafeCustomer = Omit<
  User,
  | "password_hash"
  | "verification_token"
  | "verification_token_expires"
  | "reset_token"
  | "reset_token_expires"
>;

function sanitize(user: User): SafeCustomer {
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

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Register a new customer. Generates a verification token and logs the URL.
 */
export async function registerCustomer(input: {
  email: string;
  password: string;
  full_name?: string | null;
  phone?: string | null;
}): Promise<SafeCustomer> {
  const supabase = createAdminClient();
  const passwordHash = await hash(input.password, 12);
  const verificationToken = generateToken();
  const verificationExpires = new Date(
    Date.now() + VERIFICATION_EXPIRY_MS,
  ).toISOString();

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: input.email,
      password_hash: passwordHash,
      full_name: input.full_name ?? null,
      phone: input.phone ?? null,
      role: "customer",
      is_active: true,
      email_verified: false,
      verification_token: verificationToken,
      verification_token_expires: verificationExpires,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A user with this email already exists");
    }
    throw new Error(error.message);
  }

  sendVerificationEmail(input.email, input.full_name ?? null, verificationToken).catch(
    (err) => console.error("[EMAIL] Failed to send verification email:", err.message),
  );

  return sanitize(data);
}

/**
 * Authenticate a customer by email/password. Rejects non-customer roles.
 */
export async function authenticateCustomer(
  email: string,
  password: string,
): Promise<SafeCustomer | null> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) return null;
  if (!user.is_active) return null;
  if (user.role !== "customer") return null;

  const isValid = await compare(password, user.password_hash);
  if (!isValid) return null;

  if (!user.email_verified) {
    throw new EmailNotVerifiedError();
  }

  return sanitize(user);
}

/**
 * Verify a customer's email using the verification token.
 */
export async function verifyEmail(
  token: string,
): Promise<SafeCustomer | null> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (error || !user) return null;

  // Check expiry
  if (
    !user.verification_token_expires ||
    new Date(user.verification_token_expires) < new Date()
  ) {
    return null;
  }

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({
      email_verified: true,
      verification_token: null,
      verification_token_expires: null,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (updateError || !updated) return null;

  return sanitize(updated);
}

/**
 * Regenerate a verification token for a customer.
 */
export async function resendVerification(
  email: string,
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, email_verified")
    .eq("email", email)
    .eq("role", "customer")
    .single();

  if (error || !user) return false;
  if (user.email_verified) return false;

  const verificationToken = generateToken();
  const verificationExpires = new Date(
    Date.now() + VERIFICATION_EXPIRY_MS,
  ).toISOString();

  const { error: updateError } = await supabase
    .from("users")
    .update({
      verification_token: verificationToken,
      verification_token_expires: verificationExpires,
    })
    .eq("id", user.id);

  if (updateError) return false;

  sendVerificationEmail(email, null, verificationToken).catch((err) =>
    console.error("[EMAIL] Failed to resend verification email:", err.message),
  );

  return true;
}

/**
 * Initiate password reset. Always returns true to prevent email enumeration.
 */
export async function initiatePasswordReset(email: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", email)
    .eq("role", "customer")
    .single();

  if (error || !user) return true; // Don't reveal if email exists

  const resetToken = generateToken();
  const resetExpires = new Date(Date.now() + RESET_EXPIRY_MS).toISOString();

  const { error: updateError } = await supabase
    .from("users")
    .update({
      reset_token: resetToken,
      reset_token_expires: resetExpires,
    })
    .eq("id", user.id);

  if (updateError) return true;

  const { data: fullUser } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  sendPasswordResetEmail(email, fullUser?.full_name ?? null, resetToken).catch(
    (err) => console.error("[EMAIL] Failed to send password reset email:", err.message),
  );

  return true;
}

/**
 * Reset password using a valid reset token.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("reset_token", token)
    .single();

  if (error || !user) return false;

  // Check expiry
  if (
    !user.reset_token_expires ||
    new Date(user.reset_token_expires) < new Date()
  ) {
    return false;
  }

  const passwordHash = await hash(newPassword, 12);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires: null,
    })
    .eq("id", user.id);

  return !updateError;
}

/**
 * Get a customer by ID. Returns null if not found or not a customer.
 */
export async function getCustomerById(
  id: string,
): Promise<SafeCustomer | null> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("role", "customer")
    .single();

  if (error || !user) return null;

  return sanitize(user);
}

/**
 * Update customer profile fields (name, phone, avatar).
 */
export async function updateCustomerProfile(
  id: string,
  input: {
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
  },
): Promise<SafeCustomer | null> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (input.full_name !== undefined) updateData.full_name = input.full_name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.avatar_url !== undefined) updateData.avatar_url = input.avatar_url;

  if (Object.keys(updateData).length === 0) {
    return getCustomerById(id);
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .eq("role", "customer")
    .select()
    .single();

  if (error || !data) return null;

  return sanitize(data);
}
