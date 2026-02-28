import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Order,
  OrderItem,
  ShippingAddress,
} from "@/lib/supabase/types";
import type {
  CheckoutInput,
  OrderQueryInput,
  OrderStatusUpdateInput,
} from "@/lib/validators";
import { buildPaginationMeta } from "@/lib/utils";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { getAddressById } from "./address-service";

// ── Types ──────────────────────────────────────────

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

export interface CheckoutResult {
  order_id: string;
  order_number: string;
  subtotal: number;
  total: number;
  payment_method: string;
  razorpay_order_id?: string;
  razorpay_key_id?: string;
}

// ── Checkout ─────────────────────────────────────

export async function createOrderFromCart(
  customerId: string,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const supabase = createAdminClient();

  // Resolve shipping address
  let shippingAddress: ShippingAddress;

  if (input.address_id) {
    const address = await getAddressById(input.address_id, customerId);
    if (!address) throw new Error("Address not found");

    shippingAddress = {
      full_name: address.full_name,
      phone: address.phone,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    };
  } else if (input.shipping_address) {
    shippingAddress = input.shipping_address;
  } else {
    throw new Error("Shipping address is required");
  }

  // Call the atomic checkout RPC
  const { data, error } = await supabase.rpc("checkout_order", {
    p_customer_id: customerId,
    p_shipping_address: shippingAddress as unknown as string,
    p_billing_address: (input.billing_address ?? null) as unknown as string,
    p_notes: input.notes ?? null,
    p_payment_method: input.payment_method,
  });

  if (error) throw new Error(error.message);

  const result = data as unknown as {
    order_id: string;
    order_number: string;
    subtotal: number;
    total: number;
  };

  const checkoutResult: CheckoutResult = {
    order_id: result.order_id,
    order_number: result.order_number,
    subtotal: result.subtotal,
    total: result.total,
    payment_method: input.payment_method,
  };

  // If Razorpay, create the payment order
  if (input.payment_method === "razorpay") {
    const amountInPaise = Math.round(result.total * 100);
    const razorpayOrder = await createRazorpayOrder(
      amountInPaise,
      result.order_number,
      { order_id: result.order_id },
    );

    // Store Razorpay order ID in the order
    await supabase
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", result.order_id);

    checkoutResult.razorpay_order_id = razorpayOrder.id;
    checkoutResult.razorpay_key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  }

  return checkoutResult;
}

// ── Payment Verification ─────────────────────────

export async function verifyPayment(
  razorpayOrderId: string,
  paymentId: string,
  signature: string,
): Promise<OrderWithItems> {
  const isValid = verifyRazorpaySignature(
    razorpayOrderId,
    paymentId,
    signature,
  );

  if (!isValid) throw new Error("Invalid payment signature");

  const supabase = createAdminClient();

  // Find the order by razorpay_order_id
  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, status, payment_status")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (findError || !order) throw new Error("Order not found");

  if (order.payment_status === "paid") {
    throw new Error("Payment already verified");
  }

  // Update to paid + confirmed
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "confirmed",
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    })
    .eq("id", order.id);

  if (updateError) throw new Error(updateError.message);

  const updated = await getOrderById(order.id);
  if (!updated) throw new Error("Order not found after update");
  return updated;
}

// ── Get Order ────────────────────────────────────

export async function getOrderById(
  orderId: string,
): Promise<OrderWithItems | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), users(id, email, full_name, phone)")
    .eq("id", orderId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  if (!data) return null;

  return data as unknown as OrderWithItems;
}

export async function getOrderByNumber(
  orderNumber: string,
): Promise<OrderWithItems | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), users(id, email, full_name, phone)")
    .eq("order_number", orderNumber)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  if (!data) return null;

  return data as unknown as OrderWithItems;
}

// ── Customer Orders ──────────────────────────────

export async function getCustomerOrders(
  customerId: string,
  query: OrderQueryInput,
): Promise<PaginatedOrders> {
  const supabase = createAdminClient();
  const { page, limit, status, sort, order: sortOrder } = query;
  const offset = (page - 1) * limit;

  let countQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId);

  let dataQuery = supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("customer_id", customerId);

  if (status) {
    countQuery = countQuery.eq("status", status);
    dataQuery = dataQuery.eq("status", status);
  }

  const { count } = await countQuery;
  const total = count ?? 0;

  const { data, error } = await dataQuery
    .order(sort, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return {
    data: (data as unknown as OrderWithItems[]) ?? [],
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ── Admin Orders ─────────────────────────────────

export async function getAllOrders(
  query: OrderQueryInput,
): Promise<PaginatedOrders> {
  const supabase = createAdminClient();
  const {
    page,
    limit,
    status,
    payment_status,
    customer_id,
    search,
    sort,
    order: sortOrder,
  } = query;
  const offset = (page - 1) * limit;

  let countQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  let dataQuery = supabase
    .from("orders")
    .select("*, order_items(*), users(id, email, full_name, phone)");

  if (status) {
    countQuery = countQuery.eq("status", status);
    dataQuery = dataQuery.eq("status", status);
  }

  if (payment_status) {
    countQuery = countQuery.eq("payment_status", payment_status);
    dataQuery = dataQuery.eq("payment_status", payment_status);
  }

  if (customer_id) {
    countQuery = countQuery.eq("customer_id", customer_id);
    dataQuery = dataQuery.eq("customer_id", customer_id);
  }

  if (search) {
    countQuery = countQuery.ilike("order_number", `%${search}%`);
    dataQuery = dataQuery.ilike("order_number", `%${search}%`);
  }

  const { count } = await countQuery;
  const total = count ?? 0;

  const { data, error } = await dataQuery
    .order(sort, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return {
    data: (data as unknown as OrderWithItems[]) ?? [],
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ── Update Order Status (Admin) ──────────────────

export async function updateOrderStatus(
  orderId: string,
  input: OrderStatusUpdateInput,
): Promise<OrderWithItems> {
  const supabase = createAdminClient();

  const existing = await getOrderById(orderId);
  if (!existing) throw new Error("Order not found");

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["refunded"],
    cancelled: [],
    refunded: [],
  };

  const allowed = validTransitions[existing.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new Error(
      `Cannot transition from "${existing.status}" to "${input.status}"`,
    );
  }

  const updateData: Record<string, unknown> = { status: input.status };

  if (input.status === "cancelled") {
    updateData.cancelled_reason = input.cancelled_reason ?? null;
  }

  if (input.status === "refunded") {
    updateData.payment_status = "refunded";
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  // Restore stock on cancel/refund
  if (input.status === "cancelled" || input.status === "refunded") {
    await restoreStock(orderId);
  }

  const updated = await getOrderById(orderId);
  if (!updated) throw new Error("Order not found after update");
  return updated;
}

// ── Cancel Order (Customer) ──────────────────────

export async function cancelOrder(
  orderId: string,
  customerId: string,
  reason?: string,
): Promise<OrderWithItems> {
  const existing = await getOrderById(orderId);
  if (!existing) throw new Error("Order not found");

  if (existing.customer_id !== customerId) {
    throw new Error("Order not found");
  }

  if (!["pending", "confirmed"].includes(existing.status)) {
    throw new Error("Order cannot be cancelled at this stage");
  }

  return updateOrderStatus(orderId, {
    status: "cancelled",
    cancelled_reason: reason ?? "Cancelled by customer",
  });
}

// ── Restore Stock ────────────────────────────────

async function restoreStock(orderId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: items, error } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);

  for (const item of items ?? []) {
    if (item.product_id) {
      await supabase.rpc("increment_stock", {
        p_product_id: item.product_id,
        p_amount: item.quantity,
      });
    }
  }
}
