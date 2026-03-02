"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { categoryCreateSchema } from "@/lib/validators";
import type { CategoryCreateInput } from "@/lib/validators";
import { useGetCategories } from "@/features/categories/api/get-categories";

type CategoryFormValues = {
  name: string;
  parent_id?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
};

interface CategoryFormProps {
  defaultValues?: Partial<CategoryCreateInput>;
  onSubmit: (data: CategoryCreateInput) => void;
  isSubmitting: boolean;
  submitLabel: string;
  excludeId?: string;
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  excludeId,
}: CategoryFormProps) {
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useGetCategories({
      limit: 100,
      sort: "name",
      order: "asc",
    });
  const categories = (categoriesData?.data ?? []).filter(
    (cat) => cat.id !== excludeId,
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryCreateSchema) as any,
    defaultValues: {
      name: "",
      parent_id: null,
      image_url: null,
      sort_order: 0,
      is_active: true,
      ...defaultValues,
    },
  });

  const onFormSubmit = handleSubmit((data) => {
    onSubmit({
      ...data,
      sort_order: Number(data.sort_order),
    });
  });

  return (
    <form onSubmit={onFormSubmit}>
      <FieldGroup className="gap-6">
        <Field>
          <FieldLabel htmlFor="name">Category Name *</FieldLabel>
          <Input
            id="name"
            placeholder="e.g. Rings, Necklaces, Earrings"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && <FieldError id="name-error">{errors.name.message}</FieldError>}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel>Parent Category</FieldLabel>
            {isCategoriesLoading ? (
              <Skeleton className="h-7 w-full rounded-md" />
            ) : (
              <Controller
                control={control}
                name="parent_id"
                render={({ field }) => {
                  const selectedName = field.value
                    ? categories.find((c) => c.id === field.value)?.name
                    : null;
                  return (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={!!errors.parent_id}
                        aria-describedby={errors.parent_id ? "parent_id-error" : undefined}
                      >
                        <span className="truncate">
                          {selectedName ?? "None (top-level)"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (top-level)</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            )}
            {errors.parent_id && (
              <FieldError id="parent_id-error">{errors.parent_id.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="sort_order">Sort Order</FieldLabel>
            <Input
              id="sort_order"
              type="number"
              min="0"
              placeholder="0"
              aria-invalid={!!errors.sort_order}
              aria-describedby={errors.sort_order ? "sort_order-error" : undefined}
              {...register("sort_order", { valueAsNumber: true })}
            />
            {errors.sort_order && (
              <FieldError id="sort_order-error">{errors.sort_order.message}</FieldError>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="image_url">Image URL</FieldLabel>
          <Input
            id="image_url"
            placeholder="https://example.com/image.jpg"
            aria-invalid={!!errors.image_url}
            aria-describedby={errors.image_url ? "image_url-error" : undefined}
            {...register("image_url")}
          />
          {errors.image_url && (
            <FieldError id="image_url-error">{errors.image_url.message}</FieldError>
          )}
        </Field>

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
          <FieldLabel htmlFor="is_active">
            Active (visible to customers)
          </FieldLabel>
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
