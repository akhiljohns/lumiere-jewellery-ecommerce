import { createAdminClient } from "@/lib/supabase/admin";
import type { Address } from "@/lib/supabase/types";
import type { AddressCreateInput, AddressUpdateInput } from "@/lib/validators";

export async function getCustomerAddresses(
  customerId: string,
): Promise<Address[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAddressById(
  addressId: string,
  customerId: string,
): Promise<Address | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}

export async function createAddress(
  customerId: string,
  input: AddressCreateInput,
): Promise<Address> {
  const supabase = createAdminClient();

  // If setting as default, unset existing defaults
  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      customer_id: customerId,
      label: input.label,
      full_name: input.full_name,
      phone: input.phone,
      address_line_1: input.address_line_1,
      address_line_2: input.address_line_2 ?? null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      country: input.country,
      is_default: input.is_default,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAddress(
  addressId: string,
  customerId: string,
  input: AddressUpdateInput,
): Promise<Address> {
  const supabase = createAdminClient();

  // Verify ownership
  const existing = await getAddressById(addressId, customerId);
  if (!existing) throw new Error("Address not found");

  // If setting as default, unset existing defaults
  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId)
      .eq("is_default", true)
      .neq("id", addressId);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update(input)
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAddress(
  addressId: string,
  customerId: string,
): Promise<void> {
  const supabase = createAdminClient();

  // Verify ownership
  const existing = await getAddressById(addressId, customerId);
  if (!existing) throw new Error("Address not found");

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (error) throw new Error(error.message);
}
