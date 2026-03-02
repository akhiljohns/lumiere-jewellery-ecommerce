"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeInUp } from "../motion-variants";

export function NewsletterSection() {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    toast.success("Thank you for subscribing!");
    setEmail("");
  }

  return (
    <section className="relative overflow-hidden bg-card py-16">
      {/* Decorative blur circles */}
      <div className="absolute -top-16 -right-16 size-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-primary/10 blur-3xl" />

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6"
      >
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Join Our World of Elegance
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Subscribe to receive exclusive offers, new collection launches, and
          jewellery care tips delivered to your inbox.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="sm:max-w-xs"
          />
          <Button type="submit" size="lg">
            Subscribe
          </Button>
        </form>
      </motion.div>
    </section>
  );
}
