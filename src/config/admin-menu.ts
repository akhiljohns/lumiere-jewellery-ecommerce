import { LayoutDashboard, Package, Users, type LucideIcon } from "lucide-react";

export interface AdminMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const adminMenuItems: AdminMenuItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
];
