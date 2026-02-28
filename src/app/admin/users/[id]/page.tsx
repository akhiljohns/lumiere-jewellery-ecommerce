"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailSkeleton } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { DetailField } from "@/components/detail-field";
import { useGetUser } from "@/features/users/api/get-user";

export default function ViewUserPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useGetUser(id);

  if (isLoading) return <DetailSkeleton fields={7} />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message || "Failed to load user"}
        backUrl="/admin/users"
      />
    );
  }

  const user = data?.data;
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user.full_name || user.email}
        subtitle="User details"
        backUrl="/admin/users"
        action={
          <Link href={`/admin/users/${id}/edit`} className={buttonVariants({ size: "lg" })}>
            <Pencil />
            Edit User
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Full Name" value={user.full_name || "—"} />
            <DetailField label="Email" value={user.email} />
            <DetailField label="Phone" value={user.phone || "—"} />
            <DetailField
              label="Role"
              value={
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              }
            />
            <DetailField
              label="Status"
              value={
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <DetailField
              label="Created"
              value={new Date(user.created_at).toLocaleDateString()}
            />
            <DetailField
              label="Last Updated"
              value={new Date(user.updated_at).toLocaleDateString()}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
