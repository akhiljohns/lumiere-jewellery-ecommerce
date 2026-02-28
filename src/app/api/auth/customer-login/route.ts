import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import {
  authenticateCustomer,
  EmailNotVerifiedError,
} from "@/features/auth/services/customer-auth-service";
import { signCustomerToken } from "@/lib/jwt";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const customer = await authenticateCustomer(
      parsed.data.email,
      parsed.data.password,
    );
    if (!customer) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signCustomerToken({
      id: customer.id,
      email: customer.email,
    });

    const response = NextResponse.json(
      { data: customer, message: "Login successful" },
      { status: 200 },
    );

    response.cookies.set("customer-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    setCsrfCookie(response, generateCsrfToken());

    return response;
  } catch (err) {
    if (err instanceof EmailNotVerifiedError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
