import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getUserById } from "@/features/auth/services/auth-service";
import { getUserPermissions } from "@/features/auth/services/permission-service";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const user = await getUserById(payload.sub);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const permissions = await getUserPermissions(user.role);

    return NextResponse.json({ data: { user, permissions } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
