"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { useGetRole } from "@/features/roles/api/get-role";
import { useUpdateRole } from "@/features/roles/api/update-role";
import { RoleForm } from "@/features/roles/components/role-form";
import { useAuthStore } from "@/stores/auth-store";
import { getRoleRank, SUPER_ADMIN_ROLE } from "@/lib/permissions";

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetRole(id);
  const updateRole = useUpdateRole();
  const currentUserRole = useAuthStore((s) => s.user?.role ?? "");

  const role = data?.data;

  // Block access if this role cannot be edited
  useEffect(() => {
    if (!role) return;
    if (role.name === SUPER_ADMIN_ROLE) {
      toast.error("The super_admin role is locked and cannot be modified");
      router.replace("/admin/roles");
      return;
    }
    if (
      currentUserRole !== SUPER_ADMIN_ROLE &&
      getRoleRank(currentUserRole) <= getRoleRank(role.name)
    ) {
      toast.error("You cannot edit a role with equal or higher rank than your own");
      router.replace("/admin/roles");
    }
  }, [role, currentUserRole, router]);

  if (isLoading) return <PageLoader message="Loading role..." />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message || "Failed to load role"}
        backUrl="/admin/roles"
      />
    );
  }

  if (!role) return null;

  // Don't flash the form before the redirect fires
  if (
    role.name === SUPER_ADMIN_ROLE ||
    (currentUserRole !== SUPER_ADMIN_ROLE &&
      getRoleRank(currentUserRole) <= getRoleRank(role.name))
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Role"
        subtitle={`Update permissions for ${role.name}`}
        backUrl="/admin/roles"
      />

      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleForm
            isEdit
            isSystemRole={role.is_system}
            defaultValues={{
              name: role.name,
              description: role.description ?? "",
              permissions: role.permissions,
            }}
            submitLabel="Save Changes"
            isSubmitting={updateRole.isPending}
            onSubmit={(formData) => {
              updateRole.mutate(
                { id, data: formData },
                {
                  onSuccess: () => {
                    toast.success("Role updated successfully");
                    router.push("/admin/roles");
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
