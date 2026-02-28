import { z } from "zod";

/** Strip HTML tags from a string (defense-in-depth XSS prevention). */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

/** Create a sanitized string schema with an optional max length. */
function sanitizedString(maxLength?: number) {
  const base = maxLength ? z.string().max(maxLength) : z.string();
  return base.transform(stripHtml);
}

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
  description: sanitizedString().optional(),
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
  is_featured: z.boolean().optional().default(false),
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

// ── Addresses ──────────────────────────────────────

export const shippingAddressSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 characters")
    .max(15, "Phone must be at most 15 characters"),
  address_line_1: z.string().min(1, "Address line 1 is required").max(500),
  address_line_2: z.string().max(500).optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  country: z.string().max(100).default("India"),
});

export const addressCreateSchema = shippingAddressSchema.extend({
  label: z.string().min(1, "Label is required").max(50).default("Home"),
  is_default: z.boolean().default(false),
});

export const addressUpdateSchema = addressCreateSchema.partial();

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;

// ── Checkout & Orders ──────────────────────────────

export const checkoutSchema = z
  .object({
    shipping_address: shippingAddressSchema.optional(),
    address_id: z.string().uuid("Invalid address ID").optional(),
    billing_address: shippingAddressSchema.optional().nullable(),
    notes: sanitizedString(1000).optional().nullable(),
    payment_method: z.enum(["cod", "razorpay"]),
  })
  .refine((data) => data.shipping_address || data.address_id, {
    message: "Either shipping_address or address_id is required",
    path: ["shipping_address"],
  });

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  cancelled_reason: sanitizedString(500).optional().nullable(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay signature is required"),
});

export const orderQuerySchema = paginationSchema.extend({
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
  payment_status: z
    .enum(["pending", "paid", "failed", "refunded"])
    .optional(),
  customer_id: z.string().uuid().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

// ── Wishlist ───────────────────────────────────────

export const wishlistToggleSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
});

export type WishlistToggleInput = z.infer<typeof wishlistToggleSchema>;

// ── Public Storefront Queries ─────────────────────────

export const publicProductQuerySchema = paginationSchema.extend({
  category_id: z.string().uuid().optional(),
  category_slug: z.string().optional(),
  material: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  is_featured: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z
    .enum(["created_at", "price", "name"])
    .default("created_at"),
});

export const searchQuerySchema = paginationSchema.extend({
  query: z.string().min(1, "Search query is required"),
  category_id: z.string().uuid().optional(),
  material: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
});

export const adminSearchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.enum(["products", "users", "orders"]).default("products"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type PublicProductQueryInput = z.infer<typeof publicProductQuerySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type AdminSearchQueryInput = z.infer<typeof adminSearchQuerySchema>;

// ── AI Generation ─────────────────────────────────

export const aiGenerateDescriptionSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  category: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  weight: z.string().optional().nullable(),
});

export const aiGenerateAltTextSchema = z.object({
  image_url: z.string().url("Invalid image URL"),
});

export type AIGenerateDescriptionInput = z.infer<typeof aiGenerateDescriptionSchema>;
export type AIGenerateAltTextInput = z.infer<typeof aiGenerateAltTextSchema>;

export const aiSuggestCategorySchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().optional().nullable(),
});

export const aiAutoTagSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  category: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type AISuggestCategoryInput = z.infer<typeof aiSuggestCategorySchema>;
export type AIAutoTagInput = z.infer<typeof aiAutoTagSchema>;
