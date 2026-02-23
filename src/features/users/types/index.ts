import type { User } from "@/lib/supabase/types";

export type SafeUser = Omit<User, "password_hash">;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PaginatedUsers = PaginatedResponse<SafeUser>;

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}
