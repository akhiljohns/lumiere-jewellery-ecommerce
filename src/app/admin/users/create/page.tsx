"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useCreateUser } from "@/features/users/api/create-user";
import { UserForm } from "@/features/users/components/user-form";

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
