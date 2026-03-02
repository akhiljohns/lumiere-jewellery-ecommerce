import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/chat";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000),
  conversation_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
});

/**
 * POST /api/chat
 * Send a message to the AI shopping assistant.
 * Public endpoint — works for both guests (session_id) and authenticated customers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        parsed.error.issues,
      );
    }

    // Check if customer is authenticated (optional)
    const customerId = request.headers.get("x-user-id") ?? undefined;

    const response = await chat({
      message: parsed.data.message,
      conversation_id: parsed.data.conversation_id,
      customer_id: customerId,
      session_id: parsed.data.session_id,
    });

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
