import Link from "next/link";
import { Gem, Instagram, Facebook, Twitter, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const shopLinks = [
  { href: "/products", label: "All Products" },
  { href: "/products?sort=created_at.desc", label: "New Arrivals" },
  { href: "/products?is_featured=true", label: "Featured" },
  { href: "/products?is_featured=true", label: "Collections" },
];

const companyLinks = [
  { href: "/", label: "About Us" },
  { href: "/", label: "Contact" },
  { href: "/", label: "Careers" },
  { href: "/", label: "Press" },
];

const supportLinks = [
  { href: "/profile", label: "My Account" },
  { href: "/orders", label: "Order Tracking" },
  { href: "/cart", label: "Shopping Cart" },
  { href: "/wishlist", label: "Wishlist" },
];

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Mail, href: "#", label: "Email" },
];

export function StorefrontFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Gem className="size-4" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                Jewellery Store
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Discover exquisite handcrafted jewellery. Timeless designs crafted
              with care, precision, and love for those who appreciate the finer
              things.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Shop
            </h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Support
            </h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Jewellery Store. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
