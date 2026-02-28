import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/features/auth/services/customer-auth-service";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 },
      );
    }

    const customer = await verifyEmail(token);
    if (!customer) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { data: customer, message: "Email verified successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
