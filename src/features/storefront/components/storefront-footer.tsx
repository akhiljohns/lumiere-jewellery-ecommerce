import Link from "next/link";
import { Gem } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function StorefrontFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Store Info */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Gem className="size-3.5" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                Jewellery Store
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Discover exquisite handcrafted jewellery. Timeless designs crafted
              with care, precision, and love.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "All Products" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Customer Service
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/login", label: "My Account" },
                { href: "/orders", label: "Order Tracking" },
                { href: "/cart", label: "Shopping Cart" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <p className="text-center text-[0.625rem] text-muted-foreground">
          &copy; {new Date().getFullYear()} Jewellery Store. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
