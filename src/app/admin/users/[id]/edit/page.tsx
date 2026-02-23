"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { useGetUser } from "@/features/users/api/get-user";
import { useUpdateUser } from "@/features/users/api/update-user";
import { UserForm } from "@/features/users/components/user-form";
import type { UserCreateInput } from "@/lib/validators";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetUser(id);
  const updateUser = useUpdateUser();

  if (isLoading) return <PageLoader message="Loading user..." />;

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

  const defaultValues: Partial<UserCreateInput> = {
    email: user.email,
    password: "",
    full_name: user.full_name ?? "",
    phone: user.phone ?? "",
    role: user.role,
    is_active: user.is_active,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit User"
        subtitle={`Update ${user.full_name || user.email}`}
        backUrl={`/admin/users/${id}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            defaultValues={defaultValues}
            submitLabel="Update User"
            isSubmitting={updateUser.isPending}
            isEdit
            onSubmit={(formData) => {
              updateUser.mutate(
                { id, data: formData },
                {
                  onSuccess: () => {
                    toast.success("User updated successfully");
                    router.push(`/admin/users/${id}`);
                  },
                  onError: (err) => {
                    toast.error(err.message);
                  },
                },
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
