import { z } from "zod";

// ── Auth ──────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

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
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
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
