import { NextRequest, NextResponse } from "next/server";
import { addressUpdateSchema } from "@/lib/validators";
import {
  getAddressById,
  updateAddress,
  deleteAddress,
} from "@/features/orders/services/address-service";

interface RouteParams {
  params: Promise<{ addressId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { addressId } = await params;
    const address = await getAddressById(addressId, userId);

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: address }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { addressId } = await params;
    const body = await request.json();

    const parsed = addressUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const address = await updateAddress(addressId, userId, parsed.data);

    return NextResponse.json(
      { data: address, message: "Address updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status = message === "Address not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { addressId } = await params;
    await deleteAddress(addressId, userId);

    return NextResponse.json(
      { message: "Address deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status = message === "Address not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
