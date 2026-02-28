/**
 * Centralized API route paths.
 * All client-side API calls should reference these constants
 * instead of hardcoding path strings.
 */

// ── Admin ────────────────────────────────────────────

export const ADMIN_PRODUCTS = "/api/admin/products";
export const adminProduct = (id: string) => `${ADMIN_PRODUCTS}/${id}`;

export const ADMIN_USERS = "/api/admin/users";
export const adminUser = (id: string) => `${ADMIN_USERS}/${id}`;

export const ADMIN_CATEGORIES = "/api/admin/categories";
export const adminCategory = (id: string) => `${ADMIN_CATEGORIES}/${id}`;

export const ADMIN_ROLES = "/api/admin/roles";
export const adminRole = (id: string) => `${ADMIN_ROLES}/${id}`;

export const ADMIN_ORDERS = "/api/admin/orders";
export const adminOrder = (id: string) => `${ADMIN_ORDERS}/${id}`;

export const ADMIN_STATS = "/api/admin/stats";

// ── Customer ─────────────────────────────────────────

export const CUSTOMER_PROFILE = "/api/customer/profile";

export const CUSTOMER_CART = "/api/customer/cart";
export const CUSTOMER_CART_SYNC = "/api/customer/cart/sync";

export const CUSTOMER_ORDERS = "/api/customer/orders";
export const customerOrder = (id: string) => `${CUSTOMER_ORDERS}/${id}`;
export const customerOrderCancel = (id: string) =>
  `${CUSTOMER_ORDERS}/${id}/cancel`;

export const CUSTOMER_ADDRESSES = "/api/customer/addresses";
export const customerAddress = (id: string) =>
  `${CUSTOMER_ADDRESSES}/${id}`;

export const CUSTOMER_WISHLIST = "/api/customer/wishlist";
export const CUSTOMER_WISHLIST_CHECK = "/api/customer/wishlist/check";
export const customerWishlistItem = (productId: string) =>
  `${CUSTOMER_WISHLIST}/${productId}`;

// ── Public (Storefront) ──────────────────────────────

export const PUBLIC_PRODUCTS = "/api/products";
export const publicProduct = (slug: string) => `${PUBLIC_PRODUCTS}/${slug}`;
export const PUBLIC_PRODUCTS_FEATURED = "/api/products/featured";
export const PUBLIC_PRODUCTS_SEARCH = "/api/products/search";

export const PUBLIC_CATEGORIES = "/api/categories";

// ── Auth ─────────────────────────────────────────────

export const AUTH_GUEST_CHECKOUT = "/api/auth/guest-checkout";

// ── Upload ───────────────────────────────────────────

export const UPLOAD_IMAGE = "/api/upload/image";
