import { StorefrontNavbar } from "@/features/storefront/components/storefront-navbar";
import { StorefrontFooter } from "@/features/storefront/components/storefront-footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <StorefrontNavbar />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
