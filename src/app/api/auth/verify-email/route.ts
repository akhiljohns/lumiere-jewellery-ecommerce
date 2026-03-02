import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/features/auth/services/customer-auth-service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        `${APP_URL}/signin?error=Token+is+required`,
      );
    }

    const customer = await verifyEmail(token);
    if (!customer) {
      return NextResponse.redirect(
        `${APP_URL}/signin?error=Invalid+or+expired+verification+token`,
      );
    }

    return NextResponse.redirect(
      `${APP_URL}/signin?verified=true`,
    );
  } catch {
    return NextResponse.redirect(
      `${APP_URL}/signin?error=Verification+failed`,
    );
  }
}
