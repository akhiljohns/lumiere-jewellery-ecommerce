"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Loader2, Package, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useGetProfile } from "@/features/auth/api/get-profile";
import { useUpdateProfile } from "@/features/auth/api/update-profile";
import { useGetCustomerOrders } from "@/features/orders/api/get-customer-orders";
import { formatCurrency } from "@/lib/utils";
import { fetchApi } from "@/lib/api-client";

export default function ProfilePage() {
  const router = useRouter();
  const { data: profileData, isLoading: profileLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const { data: ordersData } = useGetCustomerOrders({
    page: 1,
    limit: 5,
    sort: "created_at",
    order: "desc",
  });

  const user = profileData?.data;
  const recentOrders = ordersData?.data ?? [];

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const startEditing = () => {
    setForm({
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
    });
    setIsEditing(true);
    setError("");
  };

  const handleSave = async () => {
    setError("");
    try {
      await updateProfile.mutateAsync({
        full_name: form.full_name || null,
        phone: form.phone || null,
      });
      setIsEditing(false);
    } catch {
      setError("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetchApi("/api/auth/customer-logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <User className="mx-auto size-16 text-muted-foreground/50" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Sign in to view your profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          You need to be signed in to access your profile.
        </p>
        <Link
          href="/signin"
          className={buttonVariants({ className: "mt-6" })}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Account</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LogOut className="size-3.5" />
          )}
          Sign out
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Profile Details</CardTitle>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={startEditing}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {isEditing ? (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, full_name: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </Field>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    size="sm"
                  >
                    {updateProfile.isPending && (
                      <Loader2 className="animate-spin" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </FieldGroup>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">
                    {user.full_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">
                    {user.phone || "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <Link
                href="/orders"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="py-6 text-center">
                <Package className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No orders yet
                </p>
                <Link
                  href="/products"
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {order.order_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[0.625rem] font-medium text-primary">
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/orders"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Package className="size-3.5" />
          All Orders
        </Link>
      </div>
    </div>
  );
}
