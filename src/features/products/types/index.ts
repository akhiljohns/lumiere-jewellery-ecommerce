import type { Product, ProductImage } from "@/lib/supabase/types";

export type ProductWithImages = Product & { product_images: ProductImage[] };

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PaginatedProducts = PaginatedResponse<ProductWithImages>;

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  category?: string;
}
