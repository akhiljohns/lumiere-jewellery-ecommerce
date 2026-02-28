import type {
  Order,
  OrderItem,
} from "@/lib/supabase/types";

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  users?: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
  };
}

export interface PaginatedOrders {
  data: OrderWithItems[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  payment_status?: string;
  customer_id?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CustomerOrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
}
