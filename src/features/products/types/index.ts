import type { Product, ProductImage, Category } from "@/lib/supabase/types";

export type ProductWithImages = Product & {
  product_images: ProductImage[];
  categories: Category | null;
};

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
  category_id?: string;
}
