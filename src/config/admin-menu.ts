import { LayoutDashboard, Package, Users, ShieldCheck, type LucideIcon } from "lucide-react";

export interface AdminMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export const adminMenuItems: AdminMenuItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
    permission: "product.view",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    permission: "user.view",
  },
  {
    title: "Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
  },
];
