import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators";
import { initiatePasswordReset } from "@/features/auth/services/customer-auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    await initiatePasswordReset(parsed.data.email);

    // Always return success to prevent email enumeration
    return NextResponse.json(
      { message: "If an account exists with this email, a password reset link has been sent" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
