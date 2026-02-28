import { NextRequest, NextResponse } from "next/server";
import { customerRegisterSchema } from "@/lib/validators";
import { registerCustomer } from "@/features/auth/services/customer-auth-service";

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

    return NextResponse.json(
      {
        data: customer,
        message:
          "Registration successful. Please check your email to verify your account.",
      },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
