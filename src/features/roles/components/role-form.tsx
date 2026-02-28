"use client";

import { useForm, Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { PERMISSIONS_BY_RESOURCE } from "@/lib/permissions";
import type { RoleCreateInput } from "@/features/roles/api/create-role";
import type { RoleUpdateInput } from "@/features/roles/api/update-role";

type RoleFormValues = {
  name: string;
  description: string;
  permissions: string[];
};

interface RoleFormBaseProps {
  defaultValues?: Partial<RoleFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  isSystemRole?: boolean;
}

interface RoleFormCreateProps extends RoleFormBaseProps {
  isEdit?: false;
  onSubmit: (data: RoleCreateInput) => void;
}

interface RoleFormEditProps extends RoleFormBaseProps {
  isEdit: true;
  onSubmit: (data: RoleUpdateInput) => void;
}

type RoleFormProps = RoleFormCreateProps | RoleFormEditProps;

const RESOURCE_LABELS: Record<string, string> = {
  product: "Products",
  user: "Users",
  role: "Roles",
  dashboard: "Dashboard",
};

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

export function RoleForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  isEdit = false,
  isSystemRole = false,
}: RoleFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormValues>({
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
      ...defaultValues,
    },
  });

  const selectedPermissions = watch("permissions");

  function togglePermission(perm: string) {
    const current = selectedPermissions;
    const next = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    setValue("permissions", next);
  }

  function toggleResource(resource: string) {
    const resourcePerms = PERMISSIONS_BY_RESOURCE[resource] ?? [];
    const allSelected = resourcePerms.every((p) =>
      selectedPermissions.includes(p),
    );
    const current = selectedPermissions.filter(
      (p) => !resourcePerms.includes(p as any),
    );
    setValue(
      "permissions",
      allSelected ? current : [...current, ...resourcePerms],
    );
  }

  const onFormSubmit = handleSubmit((data) => {
    if (isEdit) {
      const updateData: RoleUpdateInput = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description || null;
      updateData.permissions = data.permissions;
      (onSubmit as (data: RoleUpdateInput) => void)(updateData);
    } else {
      (onSubmit as (data: RoleCreateInput) => void)({
        name: data.name,
        description: data.description || null,
        permissions: data.permissions,
      });
    }
  });

  return (
    <form onSubmit={onFormSubmit}>
      <FieldGroup className="gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Role Name *</FieldLabel>
            <Input
              id="name"
              placeholder="e.g. product_manager"
              disabled={isSystemRole}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : isSystemRole ? "name-desc" : undefined}
              {...register("name", { required: "Role name is required" })}
            />
            {isSystemRole && (
              <p id="name-desc" className="text-xs text-muted-foreground mt-1">
                System role names cannot be changed.
              </p>
            )}
            {errors.name && <FieldError id="name-error">{errors.name.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Input
              id="description"
              placeholder="What does this role do?"
              {...register("description")}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Permissions</FieldLabel>
          <div className="mt-2 space-y-4 rounded-lg border border-border p-4">
            {Object.entries(PERMISSIONS_BY_RESOURCE).map(([resource, perms]) => {
              const allSelected = perms.every((p) =>
                selectedPermissions.includes(p),
              );
              const someSelected = perms.some((p) =>
                selectedPermissions.includes(p),
              );

              return (
                <div key={resource}>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id={`resource-${resource}`}
                      checked={allSelected}
                      data-state={
                        someSelected && !allSelected ? "indeterminate" : undefined
                      }
                      onCheckedChange={() => toggleResource(resource)}
                    />
                    <label
                      htmlFor={`resource-${resource}`}
                      className="text-sm font-semibold cursor-pointer"
                    >
                      {RESOURCE_LABELS[resource] ?? resource}
                    </label>
                  </div>
                  <div className="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {perms.map((perm) => {
                      const action = perm.split(".")[1];
                      return (
                        <div key={perm} className="flex items-center gap-1.5">
                          <Controller
                            control={control}
                            name="permissions"
                            render={() => (
                              <Checkbox
                                id={perm}
                                checked={selectedPermissions.includes(perm)}
                                onCheckedChange={() => togglePermission(perm)}
                              />
                            )}
                          />
                          <label
                            htmlFor={perm}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            {ACTION_LABELS[action] ?? action}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Field>

        <div className="flex justify-end gap-3">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
