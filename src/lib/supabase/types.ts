/**
 * Supabase Database Types
 *
 * These types represent the database schema.
 * In production, generate these with:
 *   npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 */

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          name: string;
          resource: string;
          action: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          resource: string;
          action: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          resource?: string;
          action?: string;
          description?: string | null;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: string;
          is_active: boolean;
          email_verified: boolean;
          verification_token: string | null;
          verification_token_expires: string | null;
          reset_token: string | null;
          reset_token_expires: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string;
          is_active?: boolean;
          email_verified?: boolean;
          verification_token?: string | null;
          verification_token_expires?: string | null;
          reset_token?: string | null;
          reset_token_expires?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string;
          is_active?: boolean;
          email_verified?: boolean;
          verification_token?: string | null;
          verification_token_expires?: string | null;
          reset_token?: string | null;
          reset_token_expires?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_price: number | null;
          category_id: string | null;
          material: string | null;
          weight: string | null;
          stock: number;
          is_active: boolean;
          is_featured: boolean;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          compare_price?: number | null;
          category_id?: string | null;
          material?: string | null;
          weight?: string | null;
          stock?: number;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_price?: number | null;
          category_id?: string | null;
          material?: string | null;
          weight?: string | null;
          stock?: number;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          public_id: string;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          public_id: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          public_id?: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          customer_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          state: string;
          pincode: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          label?: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          state: string;
          pincode: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          label?: string;
          full_name?: string;
          phone?: string;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_status: "pending" | "paid" | "failed" | "refunded";
          payment_method: "cod" | "razorpay";
          subtotal: number;
          discount: number;
          shipping_fee: number;
          total: number;
          shipping_address: ShippingAddress;
          billing_address: ShippingAddress | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          notes: string | null;
          cancelled_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          payment_method: "cod" | "razorpay";
          subtotal?: number;
          discount?: number;
          shipping_fee?: number;
          total?: number;
          shipping_address: ShippingAddress;
          billing_address?: ShippingAddress | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          notes?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          payment_method?: "cod" | "razorpay";
          subtotal?: number;
          discount?: number;
          shipping_fee?: number;
          total?: number;
          shipping_address?: ShippingAddress;
          billing_address?: ShippingAddress | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          notes?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_slug: string;
          product_image: string | null;
          price: number;
          quantity: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_slug: string;
          product_image?: string | null;
          price: number;
          quantity: number;
          total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_slug?: string;
          product_image?: string | null;
          price?: number;
          quantity?: number;
          total?: number;
          created_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
    };
  };
}

// ── Shipping Address (JSONB shape stored in orders) ──
export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// ── Convenience type aliases ──
export type Role = Database["public"]["Tables"]["roles"]["Row"];
export type RoleInsert = Database["public"]["Tables"]["roles"]["Insert"];

export type Permission = Database["public"]["Tables"]["permissions"]["Row"];
export type PermissionInsert =
  Database["public"]["Tables"]["permissions"]["Insert"];

export type RolePermission =
  Database["public"]["Tables"]["role_permissions"]["Row"];

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert =
  Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate =
  Database["public"]["Tables"]["categories"]["Update"];

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];
export type ProductImageInsert =
  Database["public"]["Tables"]["product_images"]["Insert"];
export type ProductImageUpdate =
  Database["public"]["Tables"]["product_images"]["Update"];

export type Cart = Database["public"]["Tables"]["carts"]["Row"];
export type CartInsert = Database["public"]["Tables"]["carts"]["Insert"];
export type CartUpdate = Database["public"]["Tables"]["carts"]["Update"];

export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];
export type CartItemInsert =
  Database["public"]["Tables"]["cart_items"]["Insert"];
export type CartItemUpdate =
  Database["public"]["Tables"]["cart_items"]["Update"];

export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type AddressInsert =
  Database["public"]["Tables"]["addresses"]["Insert"];
export type AddressUpdate =
  Database["public"]["Tables"]["addresses"]["Update"];

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert =
  Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderItemUpdate =
  Database["public"]["Tables"]["order_items"]["Update"];

export type Wishlist = Database["public"]["Tables"]["wishlists"]["Row"];
export type WishlistInsert =
  Database["public"]["Tables"]["wishlists"]["Insert"];
