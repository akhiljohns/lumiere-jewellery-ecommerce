import { z } from "zod";

// ── Auth ──────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Customer Auth ────────────────────────────────────

export const customerRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const customerProfileUpdateSchema = z.object({
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().url("Invalid avatar URL").optional().nullable(),
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CustomerProfileUpdateInput = z.infer<
  typeof customerProfileUpdateSchema
>;

// ── Categories ──────────────────────────────────────

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  parent_id: z.string().uuid().optional().nullable(),
  image_url: z.string().url("Invalid image URL").optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

// ── Products ─────────────────────────────────────────

export const productImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  public_id: z.string().min(1, "Public ID is required"),
  is_primary: z.boolean().default(false),
});

export const productCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  compare_price: z
    .number()
    .positive("Compare price must be positive")
    .optional()
    .nullable(),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  material: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  is_active: z.boolean().default(true),
  images: z.array(productImageSchema).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// ── Users ────────────────────────────────────────────

export const userCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().default("customer"),
  is_active: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z
    .union([z.string().min(6, "Password must be at least 6 characters"), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// ── Query Params ─────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sort: z.string().default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const categoryQuerySchema = paginationSchema.extend({
  parent_id: z.string().uuid().optional(),
  active_only: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const productQuerySchema = paginationSchema.extend({
  category_id: z.string().uuid().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

// ── Cart ────────────────────────────────────────

export const addToCartSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const cartSyncItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const cartSyncSchema = z.object({
  items: z.array(cartSyncItemSchema),
});

export const guestCheckoutSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  items: z.array(cartSyncItemSchema),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartSyncInput = z.infer<typeof cartSyncSchema>;
export type GuestCheckoutSignupInput = z.infer<
  typeof guestCheckoutSignupSchema
>;
