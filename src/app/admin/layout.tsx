import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminCommandPalette } from "@/components/admin-command-palette";
import { DarkModeSwitcher } from "@/components/dark-mode-switcher";
import { GlobalKeyboardHandler } from "@/components/global-keyboard-handler";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

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

  const user = {
    name: payload?.email?.split("@")[0] ?? "Admin",
    email: payload?.email ?? "admin@jewellery.com",
  };

  return (
    <SidebarProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none">
        Skip to main content
      </a>
      <GlobalKeyboardHandler />
      <AdminCommandPalette />
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto">
            <DarkModeSwitcher />
          </div>
        </header>
        <div id="main-content" className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
