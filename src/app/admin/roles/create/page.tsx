"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useCreateRole } from "@/features/roles/api/create-role";
import { RoleForm } from "@/features/roles/components/role-form";

export default function CreateRolePage() {
  const router = useRouter();
  const createRole = useCreateRole();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create Role"
        subtitle="Define a new role and assign permissions"
        backUrl="/admin/roles"
      />

      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleForm
            submitLabel="Create Role"
            isSubmitting={createRole.isPending}
            onSubmit={(data) => {
              createRole.mutate(data, {
                onSuccess: () => {
                  toast.success("Role created successfully");
                  router.push("/admin/roles");
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
