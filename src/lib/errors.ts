import { NextResponse } from "next/server";

// ── Error Codes ──────────────────────────────────────

export const ErrorCode = {
  // 400 — Bad Request
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",

  // 401 — Unauthorized
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // 403 — Forbidden
  FORBIDDEN: "FORBIDDEN",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",

  // 404 — Not Found
  NOT_FOUND: "NOT_FOUND",

  // 409 — Conflict
  CONFLICT: "CONFLICT",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",

  // 429 — Too Many Requests
  RATE_LIMITED: "RATE_LIMITED",

  // 500 — Internal Server Error
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

const CODE_STATUS_MAP: Record<ErrorCodeType, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.EMAIL_NOT_VERIFIED]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INSUFFICIENT_STOCK]: 409,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

// ── AppError class ──────────────────────────────────

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCodeType,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = CODE_STATUS_MAP[code];
    this.details = details;
  }
}

// ── API error response helper ───────────────────────

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const body: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    };
    if (error.details !== undefined) {
      body.details = error.details;
    }
    return NextResponse.json(body, { status: error.statusCode });
  }

  // Fallback for unknown errors — don't leak internals
  const message =
    error instanceof Error ? error.message : "Internal server error";

  return NextResponse.json(
    { error: message, code: ErrorCode.INTERNAL_ERROR },
    { status: 500 },
  );
}
