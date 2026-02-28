"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSkeleton } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { useCreateUser } from "@/features/users/api/create-user";

const UserForm = dynamic(
  () => import("@/features/users/components/user-form").then((m) => m.UserForm),
  { ssr: false, loading: () => <FormSkeleton /> },
);

export default function CreateUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();
  const { canCreate } = usePermissions();

  useEffect(() => {
    if (!canCreate("user")) {
      router.replace("/admin");
    }
  }, [canCreate, router]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create User"
        subtitle="Add a new user account"
        backUrl="/admin/users"
      />

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            submitLabel="Create User"
            isSubmitting={createUser.isPending}
            onSubmit={(data) => {
              createUser.mutate(data, {
                onSuccess: () => {
                  toast.success("User created successfully");
                  router.push("/admin/users");
                },
                onError: (err) => {
                  toast.error(err.message);
                },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
