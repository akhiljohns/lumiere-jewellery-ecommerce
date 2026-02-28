import { NextRequest, NextResponse } from "next/server";
import { customerRegisterSchema } from "@/lib/validators";
import { registerCustomer } from "@/features/auth/services/customer-auth-service";
import { signCustomerToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = customerRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const customer = await registerCustomer(parsed.data);

    // Auto-login: set customer-token cookie
    const token = await signCustomerToken({
      id: customer.id,
      email: customer.email,
    });

    const response = NextResponse.json(
      { data: customer, message: "Registration successful" },
      { status: 201 },
    );

    response.cookies.set("customer-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
