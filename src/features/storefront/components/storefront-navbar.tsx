"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  LogOut,
  Package,
  Heart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DarkModeSwitcher } from "@/components/dark-mode-switcher";
import { SearchOverlay } from "./search-overlay";
import { useCartStore } from "@/stores/cart-store";
import { useGetProfile } from "@/features/auth/api/get-profile";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/products?is_featured=true", label: "Collections" },
];

export function StorefrontNavbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { data: profile } = useGetProfile();
  const user = profile?.data;

  useEffect(() => setMounted(true), []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-display text-2xl font-semibold tracking-wide text-foreground md:text-3xl">
              LUMIÈRE
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
              <span className="sr-only">Search</span>
            </Button>

            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="size-4" />
                <span className="sr-only">Cart</span>
              </Button>
              {mounted && itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 flex size-4 items-center justify-center p-0 text-[0.5rem]">
                  {itemCount > 99 ? "99+" : itemCount}
                </Badge>
              )}
            </Link>

            <div className="hidden md:block">
              <DarkModeSwitcher />
            </div>

            {/* User Menu */}
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon">
                      <User className="size-4" />
                      <span className="sr-only">Account</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium">{user.full_name}</p>
                    <p className="text-[0.625rem] text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <User className="size-3.5" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/orders" />}>
                    <Package className="size-3.5" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/wishlist" />}>
                    <Heart className="size-3.5" />
                    Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/logout" />}>
                    <LogOut className="size-3.5" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/signin" className="hidden md:block">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="size-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                }
              />
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-6 py-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                        pathname === link.href
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {!user && (
                    <Link
                      href="/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                      Sign in
                    </Link>
                  )}
                </nav>
                <div className="px-9 py-2">
                  <DarkModeSwitcher />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
