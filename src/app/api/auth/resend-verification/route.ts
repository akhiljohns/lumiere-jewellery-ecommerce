import { NextRequest, NextResponse } from "next/server";
import { resendVerification } from "@/features/auth/services/customer-auth-service";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    await resendVerification(email);

    // Always return success to prevent email enumeration
    return NextResponse.json(
      { message: "If the email exists and is unverified, a new verification link has been sent." },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
