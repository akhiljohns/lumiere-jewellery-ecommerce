import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Gem } from "lucide-react";
import { verifyToken } from "@/lib/jwt";
import { AdminNav } from "@/features/admin/components/admin-nav";

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
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside className="bg-card border-r w-60 flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
            <Gem className="size-3.5" />
          </div>
          <span className="font-semibold tracking-tight">Jewellery Admin</span>
        </div>
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
        <div className="border-t px-4 py-3">
          <p className="text-muted-foreground text-xs truncate">
            {payload?.email ?? "Admin"}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
