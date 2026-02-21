import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { authenticateUser } from "@/features/auth/services/auth-service";
import { signToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Authenticate
    const user = await authenticateUser(
      parsed.data.email,
      parsed.data.password,
    );
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Sign JWT
    const token = await signToken({ id: user.id, email: user.email });

    // Set HTTP-only cookie
    const response = NextResponse.json(
      { data: user, message: "Login successful" },
      { status: 200 },
    );

    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
