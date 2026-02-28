import type {
  Product,
  ProductImage,
  Category,
} from "@/lib/supabase/types";

export type PublicProduct = Product & {
  product_images: ProductImage[];
  categories: Category | null;
};

export interface PaginatedPublicProducts {
  data: PublicProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type CategoryWithCount = Category & {
  product_count: number;
};

export interface StorefrontProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  category_id?: string;
  category_slug?: string;
  material?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
}

export interface SearchQueryParams {
  query: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  category_id?: string;
  material?: string;
  min_price?: number;
  max_price?: number;
}
