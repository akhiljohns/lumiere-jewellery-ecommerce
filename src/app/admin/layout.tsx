import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Gem, LogOut } from "lucide-react";
import Link from "next/link";
import { verifyToken } from "@/lib/jwt";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Admin Dashboard | Jewellery Store",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  const payload = token ? await verifyToken(token) : null;

  return (
    <div className="flex min-h-svh bg-muted">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gem className="size-3.5" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">
            Jewellery Admin
          </span>
        </div>
        <Separator />
        <nav className="flex-1 px-3 py-4">
          <AdminNav
            items={[
              {
                href: "/admin",
                label: "Dashboard",
                icon: "LayoutDashboard",
              },
              {
                href: "/admin/products",
                label: "Products",
                icon: "Package",
              },
              {
                href: "/admin/users",
                label: "Users",
                icon: "Users",
              },
            ]}
          />
        </nav>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-xs text-muted-foreground truncate">
            {payload?.email ?? "Admin"}
          </p>
          <Link
            href="/api/auth/logout"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
