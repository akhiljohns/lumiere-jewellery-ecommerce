"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { heroContainer, heroItem, heroImage } from "../motion-variants";

interface HeroSectionProps {
  heroImageUrl?: string;
}

export function HeroSection({ heroImageUrl }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-primary/5 py-16 lg:py-24">
      {/* Decorative blur circles */}
      <div className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* Left column — text */}
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6 text-center lg:text-left"
        >
          <motion.div variants={heroItem}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3" />
              New Collection
            </span>
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Timeless Elegance,{" "}
            <span className="text-primary">Crafted for You</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mx-auto max-w-lg text-base leading-relaxed text-muted-foreground lg:mx-0"
          >
            Discover our exquisite collection of handcrafted jewellery, where
            tradition meets contemporary design. Each piece tells a unique story
            of artistry and passion.
          </motion.p>

          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Link href="/products">
              <Button size="lg" className="gap-2">
                Explore Collection
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/products?is_featured=true">
              <Button variant="outline" size="lg">
                Our Story
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right column — image */}
        <motion.div
          variants={heroImage}
          initial="hidden"
          animate="visible"
          className="flex justify-center lg:justify-end"
        >
          <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-muted shadow-lg">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt="Elegant jewellery showcase"
                fill
                sizes="(max-width: 1024px) 80vw, 40vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="space-y-3 text-center">
                  <Sparkles className="mx-auto size-12 text-primary/40" />
                  <p className="font-display text-lg font-semibold text-muted-foreground/60">
                    Premium Collection
                  </p>
                </div>
              </div>
            )}
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -left-4 size-24 rounded-full bg-primary/20 blur-2xl" />
            <div className="absolute -right-4 -top-4 size-32 rounded-full bg-primary/20 blur-2xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
