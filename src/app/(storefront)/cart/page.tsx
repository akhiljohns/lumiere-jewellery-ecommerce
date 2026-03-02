"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { PriceDisplay } from "@/features/storefront/components/price-display";
import { useCartStore, type LocalCartItem } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

const GST_RATE = 0.03;

const trustBadges = [
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Truck, label: "Insured Delivery" },
  { icon: RotateCcw, label: "30-Day Returns" },
];

function CartItemRow({ item }: { item: LocalCartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <Link
        href={`/products/${item.slug}`}
        className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted"
      >
        {item.image_url ? (
          <CloudinaryImage
            src={item.image_url}
            alt={item.name}
            width={112}
            height={112}
            crop="fill"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/products/${item.slug}`}
            className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {item.name}
          </Link>
          <PriceDisplay
            price={item.price}
            comparePrice={item.compare_price}
            size="sm"
            className="mt-0.5"
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Item total + remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(item.price * item.quantity)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => {
                removeItem(item.product_id);
                toast.success(`${item.name} removed from cart`);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Low stock warning */}
        {item.stock <= 3 && item.stock > 0 && (
          <p className="mt-1 text-xs text-destructive">
            Only {item.stock} left in stock
          </p>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const clearCart = useCartStore((s) => s.clearCart);

  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const estimatedTax = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = subtotal + estimatedTax;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            clearCart();
            toast.success("Cart cleared");
          }}
        >
          Clear Cart
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="divide-y divide-border rounded-lg border border-border bg-card p-4">
            {items.map((item) => (
              <CartItemRow key={item.product_id} item={item} />
            ))}
          </div>
          <Link href="/products" className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-4" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-6 sticky top-24">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Order Summary
            </h2>
            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. GST (3%)</span>
                <span className="font-medium">{formatCurrency(estimatedTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <Link href="/checkout" className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
              Proceed to Checkout
            </Link>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {trustBadges.map((badge) => (
                <div key={badge.label} className="flex flex-col items-center gap-1 text-center">
                  <badge.icon className="size-4 text-muted-foreground" />
                  <span className="text-[0.625rem] leading-tight text-muted-foreground">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
