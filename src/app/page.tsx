"use client";

import Link from "next/link";
import { Gem, ArrowRight, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

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
          <p className="text-base leading-relaxed text-muted-foreground">
            Discover exquisite handcrafted jewellery. Timeless designs
            crafted with care and precision.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/admin" className={buttonVariants({ size: "lg" })}>
            <ShieldCheck className="size-4" />
            Admin Dashboard
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Sign in
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Storefront coming soon. Use the admin panel to manage products.
        </p>
      </main>
    </div>
  );
}
