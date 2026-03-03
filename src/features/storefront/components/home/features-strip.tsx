"use client";

import { motion } from "framer-motion";
import { Gem, Shield, Truck, RotateCcw } from "lucide-react";

import { staggerContainer, staggerItem } from "../motion-variants";

const features = [
  {
    icon: Gem,
    title: "Handcrafted Excellence",
    description: "Each piece is meticulously crafted by skilled artisans",
  },
  {
    icon: Shield,
    title: "Lifetime Warranty",
    description: "We stand behind the quality of every piece we create",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Complimentary shipping on all orders, fully insured",
  },
  {
    icon: RotateCcw,
    title: "30-Day Returns",
    description: "Easy returns within 30 days, no questions asked",
  },
];

export function FeaturesStrip() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              className="text-center"
            >
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
