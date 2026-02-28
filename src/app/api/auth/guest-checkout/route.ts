import { NextRequest, NextResponse } from "next/server";
import { guestCheckoutSignupSchema } from "@/lib/validators";
import { registerCustomerForCheckout } from "@/features/auth/services/customer-auth-service";
import { syncCart } from "@/features/cart/services/cart-service";
import { signCustomerToken } from "@/lib/jwt";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = guestCheckoutSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { email, full_name, phone, items } = parsed.data;

    // Create account with random password + send reset email
    const customer = await registerCustomerForCheckout({
      email,
      full_name,
      phone,
    });

    // Sync cart items to the new server cart
    const cartResult = await syncCart(customer.id, items);

    // Sign JWT and set cookie
    const token = await signCustomerToken({
      id: customer.id,
      email: customer.email,
    });

    const response = NextResponse.json(
      {
        data: { customer, cart: cartResult.data },
        warnings: cartResult.warnings,
        message: "Account created. Check your email to set a password.",
      },
      { status: 201 },
    );

    response.cookies.set("customer-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    setCsrfCookie(response, generateCsrfToken());

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "A user with this email already exists") {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
