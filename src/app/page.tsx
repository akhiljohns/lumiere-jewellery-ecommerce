import Link from "next/link";
import { Gem, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Gem className="size-7" />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Jewellery Store
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Discover exquisite handcrafted jewellery. Timeless designs
            crafted with care and precision.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/admin">
              <ShieldCheck className="size-4" />
              Admin Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-xs">
          Storefront coming soon. Use the admin panel to manage products.
        </p>
      </main>
    </div>
  );
}
