import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validators";
import { resetPassword } from "@/features/auth/services/customer-auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const success = await resetPassword(parsed.data.token, parsed.data.password);
    if (!success) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
