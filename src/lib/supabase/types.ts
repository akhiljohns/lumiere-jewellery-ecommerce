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
    };
  };
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
