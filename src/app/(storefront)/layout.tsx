import { StorefrontNavbar } from "@/features/storefront/components/storefront-navbar";
import { StorefrontFooter } from "@/features/storefront/components/storefront-footer";
import { ChatWidget } from "@/features/storefront/components/chat-widget";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none">
        Skip to main content
      </a>
      <StorefrontNavbar />
      <main id="main-content" className="flex-1">{children}</main>
      <StorefrontFooter />
      <ChatWidget />
    </div>
  );
}
