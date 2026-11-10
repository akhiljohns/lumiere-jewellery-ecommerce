import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/chat";
import { AppError, ErrorCode, errorResponse } from "@/lib/errors";
import { rateLimitMiddleware } from "@/lib/rate-limit";

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
    // R12: the proxy matcher doesn't cover /api/chat, so the limit lives here.
    // In memory, per server instance: it slows one client down, it doesn't cap total traffic.
    const rl = rateLimitMiddleware(request, "chat");
    if (!rl.success) {
      return NextResponse.json(
        { error: "You're sending messages quickly. Please wait a minute and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        },
      );
    }

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
