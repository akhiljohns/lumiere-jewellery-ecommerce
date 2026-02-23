"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { userCreateSchema, userUpdateSchema } from "@/lib/validators";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import type { UserCreateInput, UserUpdateInput } from "@/lib/validators";

type UserFormValues = {
  email: string;
  password: string;
  full_name?: string | null;
  phone?: string | null;
  role: string;
  is_active: boolean;
};

interface UserFormBaseProps {
  defaultValues?: Partial<UserCreateInput>;
  isSubmitting: boolean;
  submitLabel: string;
}

interface UserFormCreateProps extends UserFormBaseProps {
  isEdit?: false;
  onSubmit: (data: UserCreateInput) => void;
}

interface UserFormEditProps extends UserFormBaseProps {
  isEdit: true;
  onSubmit: (data: UserUpdateInput) => void;
}

type UserFormProps = UserFormCreateProps | UserFormEditProps;

const ROLES = Object.keys(ROLE_PERMISSIONS).map((name) => ({
  value: name,
  label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

// Also include customer as a role option
const ALL_ROLES = [
  { value: "customer", label: "Customer" },
  ...ROLES,
];

export function UserForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  isEdit = false,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? userUpdateSchema : userCreateSchema) as any,
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role: "customer",
      is_active: true,
      ...defaultValues,
    },
  });

  const selectedRole = watch("role");
  const rolePerms = ROLE_PERMISSIONS[selectedRole] ?? [];

  const onFormSubmit = handleSubmit((data) => {
    if (isEdit) {
      const updateData: UserUpdateInput = {};
      if (data.email) updateData.email = data.email;
      if (data.password) updateData.password = data.password;
      if (data.full_name !== undefined) updateData.full_name = data.full_name || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.role) updateData.role = data.role;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      (onSubmit as (data: UserUpdateInput) => void)(updateData);
    } else {
      (onSubmit as (data: UserCreateInput) => void)(data as UserCreateInput);
    }
  });

  return (
    <form onSubmit={onFormSubmit}>
      <FieldGroup className="gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="email">Email *</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">
              Password {isEdit ? "(leave blank to keep current)" : "*"}
            </FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder={isEdit ? "••••••••" : "Min 6 characters"}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
            <Input
              id="full_name"
              placeholder="John Doe"
              {...register("full_name")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input
              id="phone"
              placeholder="+91 98765 43210"
              {...register("phone")}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel>Role *</FieldLabel>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <FieldError>{errors.role.message}</FieldError>}
          </Field>
        </div>

        {rolePerms.length > 0 && (
          <Field>
            <FieldLabel>Permissions for this role</FieldLabel>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {rolePerms.map((perm) => (
                <Badge key={perm} variant="secondary" className="text-xs font-mono">
                  {perm}
                </Badge>
              ))}
            </div>
          </Field>
        )}

        <Field orientation="horizontal">
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Checkbox
                id="is_active"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FieldLabel htmlFor="is_active">Active (can log in)</FieldLabel>
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
