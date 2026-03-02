"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, CreditCard, Check, Loader2, ShoppingBag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { useCartStore } from "@/stores/cart-store";
import { useGetProfile } from "@/features/auth/api/get-profile";
import { useGetAddresses } from "@/features/orders/api/get-addresses";
import { useCreateAddress } from "@/features/orders/api/create-address";
import { formatCurrency } from "@/lib/utils";
import { fetchApi } from "@/lib/api-client";
import type { Address } from "@/lib/supabase/types";

type Step = "address" | "review";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

// ── Address Form ────────────────────────────────────

function AddressForm({
  onSave,
  isPending,
}: {
  onSave: (data: Record<string, string>) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    pincode: "",
    label: "Home",
  });

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            pattern="\d{10,15}"
            title="Enter 10-15 digit phone number"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="address_line_1">Address Line 1</Label>
        <Input
          id="address_line_1"
          value={form.address_line_1}
          onChange={(e) => handleChange("address_line_1", e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
        <Input
          id="address_line_2"
          value={form.address_line_2}
          onChange={(e) => handleChange("address_line_2", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={form.state}
            onChange={(e) => handleChange("state", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            value={form.pincode}
            onChange={(e) => handleChange("pincode", e.target.value)}
            pattern="\d{6}"
            title="Enter 6-digit pincode"
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save & Continue
      </Button>
    </form>
  );
}

// ── Saved Address Card ──────────────────────────────

function AddressCard({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{address.label}</span>
        {selected && <Check className="h-4 w-4 text-primary" />}
      </div>
      <p className="mt-1 text-sm text-foreground">{address.full_name}</p>
      <p className="text-sm text-muted-foreground">
        {address.address_line_1}
        {address.address_line_2 && `, ${address.address_line_2}`}
      </p>
      <p className="text-sm text-muted-foreground">
        {address.city}, {address.state} — {address.pincode}
      </p>
      <p className="text-sm text-muted-foreground">{address.phone}</p>
    </button>
  );
}

// ── Main Checkout Page ──────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: profileData } = useGetProfile();
  const { data: addressesData } = useGetAddresses();
  const createAddress = useCreateAddress();

  const isAuthenticated = !!profileData?.data;
  const addresses = addressesData?.data ?? [];

  const [step, setStep] = useState<Step>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showNewForm, setShowNewForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<Record<string, string> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getSubtotal();

  // Auto-select default address
  if (addresses.length > 0 && !selectedAddressId && !showNewForm) {
    const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0];
    setSelectedAddressId(defaultAddr.id);
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add some items before checking out.
        </p>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Browse Products
        </Link>
      </div>
    );
  }

  const handleSaveNewAddress = async (form: Record<string, string>) => {
    if (isAuthenticated) {
      try {
        await createAddress.mutateAsync({
          full_name: form.full_name,
          phone: form.phone,
          address_line_1: form.address_line_1,
          address_line_2: form.address_line_2 || null,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: "India",
          label: form.label || "Home",
          is_default: addresses.length === 0,
        });
        setShowNewForm(false);
      } catch {
        setError("Failed to save address");
      }
    } else {
      setShippingAddress(form);
      setStep("review");
    }
  };

  const canProceedToReview = () => {
    if (isAuthenticated) return !!selectedAddressId;
    return !!shippingAddress;
  };

  const handleProceedToReview = () => {
    if (canProceedToReview()) setStep("review");
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Sync cart if authenticated
      if (isAuthenticated) {
        await useCartStore.getState().syncToServer();
      }

      const checkoutBody: Record<string, unknown> = {
        payment_method: paymentMethod,
        notes: notes || null,
      };

      if (isAuthenticated && selectedAddressId) {
        checkoutBody.address_id = selectedAddressId;
      } else if (shippingAddress) {
        checkoutBody.shipping_address = {
          full_name: shippingAddress.full_name,
          phone: shippingAddress.phone,
          address_line_1: shippingAddress.address_line_1,
          address_line_2: shippingAddress.address_line_2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          country: "India",
        };
      }

      const result = await fetchApi<{
        data: {
          order_id: string;
          order_number: string;
          subtotal: number;
          total: number;
          payment_method: string;
          razorpay_order_id?: string;
          razorpay_key_id?: string;
        };
      }>("/api/customer/checkout", {
        method: "POST",
        body: JSON.stringify(checkoutBody),
      });

      const order = result.data;

      if (paymentMethod === "razorpay" && order.razorpay_order_id) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setError("Failed to load payment gateway. Please try again.");
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: order.razorpay_key_id,
          amount: order.total * 100,
          currency: "INR",
          name: "Jewellery Store",
          description: `Order #${order.order_number}`,
          order_id: order.razorpay_order_id,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await fetchApi("/api/customer/checkout/verify-payment", {
                method: "POST",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              clearCart();
              router.push(`/order-confirmation?id=${order.order_id}`);
            } catch {
              setError("Payment verification failed. Contact support.");
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
            },
          },
          prefill: profileData?.data
            ? {
                name: profileData.data.full_name ?? "",
                email: profileData.data.email,
                contact: profileData.data.phone ?? "",
              }
            : undefined,
          theme: { color: "#f59e0b" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // COD — success
      clearCart();
      router.push(`/order-confirmation?id=${order.order_id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to place order",
      );
      setIsSubmitting(false);
    }
  };

  // ── Step indicator ──────────────────────────────────

  const steps = [
    { key: "address" as const, label: "Address", icon: MapPin },
    { key: "review" as const, label: "Review & Pay", icon: CreditCard },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/cart" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4" })}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="font-display text-2xl font-bold text-foreground">Checkout</h1>

      {/* Step indicator */}
      <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
        {steps.map((s, i) => {
          const isActive = step === s.key;
          const isPast =
            steps.findIndex((x) => x.key === step) >
            steps.findIndex((x) => x.key === s.key);
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${isPast ? "bg-primary" : "bg-border"}`}
                />
              )}
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isPast
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Left Column — Step Content */}
        <div className="lg:col-span-2">
          {step === "address" && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Shipping Address
              </h2>

              {!isAuthenticated && (
                <p className="mt-1 text-sm text-muted-foreground">
                  <Link href="/signin" className="text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to save your address for future orders.
                </p>
              )}

              {/* Saved addresses */}
              {isAuthenticated && addresses.length > 0 && !showNewForm && (
                <div className="mt-4 space-y-3">
                  {addresses.map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      selected={selectedAddressId === addr.id}
                      onSelect={() => setSelectedAddressId(addr.id)}
                    />
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewForm(true)}
                    className="mt-2"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Add New Address
                  </Button>

                  <div className="pt-4">
                    <Button
                      onClick={handleProceedToReview}
                      disabled={!selectedAddressId}
                      className="w-full"
                    >
                      Continue to Review
                    </Button>
                  </div>
                </div>
              )}

              {/* New address form */}
              {(showNewForm ||
                (isAuthenticated && addresses.length === 0) ||
                !isAuthenticated) && (
                <div className="mt-4">
                  {showNewForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewForm(false)}
                      className="mb-3"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to saved addresses
                    </Button>
                  )}
                  <AddressForm
                    onSave={handleSaveNewAddress}
                    isPending={createAddress.isPending}
                  />
                </div>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-6">
              {/* Shipping address review */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Shipping Address
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("address")}
                  >
                    Change
                  </Button>
                </div>
                {isAuthenticated && selectedAddressId && (
                  (() => {
                    const addr = addresses.find(
                      (a) => a.id === selectedAddressId,
                    );
                    if (!addr) return null;
                    return (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {addr.full_name}
                        </p>
                        <p>
                          {addr.address_line_1}
                          {addr.address_line_2 && `, ${addr.address_line_2}`}
                        </p>
                        <p>
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <p>{addr.phone}</p>
                      </div>
                    );
                  })()
                )}
                {!isAuthenticated && shippingAddress && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {shippingAddress.full_name}
                    </p>
                    <p>
                      {shippingAddress.address_line_1}
                      {shippingAddress.address_line_2 &&
                        `, ${shippingAddress.address_line_2}`}
                    </p>
                    <p>
                      {shippingAddress.city}, {shippingAddress.state} —{" "}
                      {shippingAddress.pincode}
                    </p>
                    <p>{shippingAddress.phone}</p>
                  </div>
                )}
              </div>

              {/* Cart items review */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Order Items
                </h2>
                <div className="mt-3 divide-y divide-border">
                  {items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {item.image_url ? (
                          <CloudinaryImage
                            src={item.image_url}
                            alt={item.name}
                            width={48}
                            height={48}
                            crop="fill"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Payment Method
                </h2>
                <div className="mt-3 space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">
                        Pay when you receive your order
                      </p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">Pay Online</p>
                      <p className="text-xs text-muted-foreground">
                        UPI, Cards, Net Banking via Razorpay
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order notes */}
              <div className="rounded-lg border border-border bg-card p-6">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for your order..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Place order */}
              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                size="lg"
                className="w-full"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {paymentMethod === "cod"
                  ? "Place Order (Cash on Delivery)"
                  : "Pay & Place Order"}
              </Button>
            </div>
          )}
        </div>

        {/* Right Column — Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-6 sticky top-24">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Order Summary
            </h2>
            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({items.length} items)
                </span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">Free</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: "Secure Payment" },
                { icon: Truck, label: "Insured Delivery" },
                { icon: RotateCcw, label: "30-Day Returns" },
              ].map((badge) => (
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
