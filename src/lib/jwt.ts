import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const ALG = "HS256";
const EXPIRATION = "7d";

export interface AdminTokenPayload extends JWTPayload {
  sub: string; // user id
  email: string;
  role: "admin";
}

/**
 * Sign a new JWT for an admin user.
 */
export async function signToken(payload: {
  id: string;
  email: string;
}): Promise<string> {
  return new SignJWT({
    sub: payload.id,
    email: payload.email,
    role: "admin" as const,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(secret);
}

/**
 * Verify and decode a JWT. Returns the payload or `null` if invalid/expired.
 */
export async function verifyToken(
  token: string,
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}
