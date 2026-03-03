"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  RefreshCcw,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DetailSkeleton } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { DetailField } from "@/components/detail-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PermissionGuard } from "@/components/permission-guard";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { useGetOrder } from "@/features/orders/api/get-order";
import { useUpdateOrderStatus } from "@/features/orders/api/update-order-status";
import { formatCurrency } from "@/lib/utils";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

const paymentVariant: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  failed: "destructive",
  refunded: "destructive",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RefreshCcw,
};

const statusSteps = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useGetOrder(id);
  const updateStatus = useUpdateOrderStatus();

  const [newStatus, setNewStatus] = useState<string>("");
  const [cancelReason, setCancelReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleStatusUpdate = useCallback(() => {
    if (!newStatus || !id) return;
    updateStatus.mutate(
      {
        id,
        data: {
          status: newStatus,
          cancelled_reason:
            newStatus === "cancelled" || newStatus === "refunded"
              ? cancelReason || undefined
              : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Order status updated to "${newStatus}"`);
          setConfirmOpen(false);
          setNewStatus("");
          setCancelReason("");
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  }, [id, newStatus, cancelReason, updateStatus]);

  if (isLoading) return <DetailSkeleton fields={8} hasSidebar />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message || "Failed to load order"}
        backUrl="/admin/orders"
      />
    );
  }

  const order = data?.data;
  if (!order) return null;

  const allowedTransitions = VALID_TRANSITIONS[order.status] ?? [];
  const address = order.shipping_address as {
    full_name?: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  } | null;

  // Determine how far along the order is in the timeline
  const currentStepIndex = statusSteps.indexOf(
    order.status as (typeof statusSteps)[number],
  );
  const isCancelledOrRefunded =
    order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Order #${order.order_number}`}
        subtitle={`Placed on ${new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}
        backUrl="/admin/orders"
      />

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {isCancelledOrRefunded ? (
            <div className="flex items-center gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4">
              <XCircle className="size-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Order {order.status}
                </p>
                {order.cancelled_reason && (
                  <p className="text-xs text-muted-foreground">
                    Reason: {order.cancelled_reason}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {statusSteps.map((step, i) => {
                const Icon = statusIcons[step] ?? Clock;
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground"
                        } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span
                        className={`text-xs capitalize ${isCompleted ? "font-medium text-foreground" : "text-muted-foreground"}`}
                      >
                        {step}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div
                        className={`mx-1 h-0.5 flex-1 ${
                          i < currentStepIndex ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Details */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items ({order.order_items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.product_image ? (
                            <CloudinaryImage
                              src={item.product_image}
                              alt={item.product_name}
                              width={40}
                              height={40}
                              crop="fill"
                              className="size-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {item.product_name}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {item.product_slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Order Summary */}
              <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4">
                <div className="flex w-48 justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex w-48 justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums text-destructive">
                      -{formatCurrency(order.discount)}
                    </span>
                  </div>
                )}
                <div className="flex w-48 justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="tabular-nums">
                    {order.shipping_fee > 0
                      ? formatCurrency(order.shipping_fee)
                      : "Free"}
                  </span>
                </div>
                <div className="flex w-48 justify-between border-t border-border pt-1 text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Status Update */}
          <PermissionGuard permission="order.edit">
            {allowedTransitions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Select
                    value={newStatus}
                    onValueChange={(v) => setNewStatus(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTransitions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(newStatus === "cancelled" || newStatus === "refunded") && (
                    <Textarea
                      placeholder="Reason for cancellation/refund..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  )}
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={!newStatus}
                    variant={
                      newStatus === "cancelled" || newStatus === "refunded"
                        ? "destructive"
                        : "default"
                    }
                    className="w-full cursor-pointer"
                  >
                    Update Status
                  </Button>
                </CardContent>
              </Card>
            )}
          </PermissionGuard>

          {/* Order Info, Customer & Shipping — Accordion */}
          <Accordion defaultValue={["order-info"]}>
            <AccordionItem value="order-info">
              <AccordionTrigger>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="size-4" />
                  Order Info
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                <DetailField
                  label="Status"
                  value={
                    <Badge
                      variant={statusVariant[order.status] ?? "secondary"}
                    >
                      {order.status}
                    </Badge>
                  }
                />
                <DetailField
                  label="Payment Status"
                  value={
                    <Badge
                      variant={
                        paymentVariant[order.payment_status] ?? "secondary"
                      }
                    >
                      {order.payment_status}
                    </Badge>
                  }
                />
                <DetailField
                  label="Payment Method"
                  value={order.payment_method.toUpperCase()}
                />
                {order.razorpay_payment_id && (
                  <DetailField
                    label="Razorpay ID"
                    value={
                      <span className="font-mono text-xs">
                        {order.razorpay_payment_id}
                      </span>
                    }
                  />
                )}
                {order.notes && (
                  <DetailField label="Notes" value={order.notes} />
                )}
                <DetailField
                  label="Created"
                  value={new Date(order.created_at).toLocaleString("en-IN")}
                />
                <DetailField
                  label="Last Updated"
                  value={new Date(order.updated_at).toLocaleString("en-IN")}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer">
              <AccordionTrigger>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <User className="size-4" />
                  Customer
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                <DetailField
                  label="Name"
                  value={order.users?.full_name || "—"}
                />
                <DetailField
                  label="Email"
                  value={order.users?.email || "—"}
                />
                <DetailField
                  label="Phone"
                  value={order.users?.phone || "—"}
                />
              </AccordionContent>
            </AccordionItem>

            {address && (
              <AccordionItem value="shipping">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="size-4" />
                    Shipping Address
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-1">
                  <div className="text-sm text-foreground leading-relaxed">
                    <p className="font-medium">{address.full_name}</p>
                    {address.phone && (
                      <p className="text-muted-foreground">{address.phone}</p>
                    )}
                    <p>{address.address_line_1}</p>
                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                    <p>
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <p>{address.country}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Update Order Status"
        description={`Are you sure you want to change the status to "${newStatus}"?${
          newStatus === "cancelled"
            ? " This will restore stock for all items."
            : newStatus === "refunded"
              ? " This will mark the order as refunded and restore stock."
              : ""
        }`}
        onConfirm={handleStatusUpdate}
        loading={updateStatus.isPending}
        destructive={newStatus === "cancelled" || newStatus === "refunded"}
      />
    </div>
  );
}
