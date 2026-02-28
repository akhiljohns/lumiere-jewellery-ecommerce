"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSkeleton } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { useCreateRole } from "@/features/roles/api/create-role";

const RoleForm = dynamic(
  () => import("@/features/roles/components/role-form").then((m) => m.RoleForm),
  { ssr: false, loading: () => <FormSkeleton /> },
);

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
