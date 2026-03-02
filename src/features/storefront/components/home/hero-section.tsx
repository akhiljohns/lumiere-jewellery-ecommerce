"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fadeInUp } from "../motion-variants";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-primary/5">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-transparent" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-6"
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Exquisite Handcrafted
            <br />
            <span className="text-primary">Jewellery</span>
          </h1>

          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Discover timeless designs crafted with care and precision. Each
            piece tells a unique story of elegance and artistry.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/products">
              <Button size="lg">
                Shop Now
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
