import { NextResponse } from "next/server";
import { clearCsrfCookie } from "@/lib/csrf";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 },
  );

  response.cookies.set("customer-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  clearCsrfCookie(response);

  return response;
}
