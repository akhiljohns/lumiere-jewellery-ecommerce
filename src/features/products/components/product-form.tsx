"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X, Sparkles } from "lucide-react";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { productCreateSchema } from "@/lib/validators";
import type { ProductCreateInput } from "@/lib/validators";
import { useGetCategories } from "@/features/categories/api/get-categories";

// Explicit form type to work around Zod v4 + hookform resolver type mismatch
type ProductFormValues = {
  name: string;
  description?: string;
  price: number;
  compare_price?: number | null;
  category_id?: string | null;
  material?: string | null;
  weight?: string | null;
  stock: number;
  is_active: boolean;
  is_featured?: boolean;
  images?: { url: string; public_id: string; is_primary: boolean }[];
};
import { useUploadImage, useDeleteImage } from "@/features/products/api/upload-image";
import { fetchApi } from "@/lib/api-client";

interface ProductImage {
  url: string;
  public_id: string;
  is_primary: boolean;
}

interface ProductFormProps {
  defaultValues?: Partial<ProductCreateInput>;
  onSubmit: (data: ProductCreateInput) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ProductFormProps) {
  const { data: categoriesData } = useGetCategories({ limit: 100, sort: "name", order: "asc" });
  const categories = categoriesData?.data ?? [];
  const [images, setImages] = useState<ProductImage[]>(
    defaultValues?.images ?? [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();
  const deleteImage = useDeleteImage();

  const [aiGenerating, setAiGenerating] = useState<"description" | "category" | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productCreateSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compare_price: null,
      category_id: null,
      material: "",
      weight: "",
      stock: 0,
      is_active: true,
      ...defaultValues,
    },
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          try {
            const result = await uploadImage.mutateAsync(base64);
            setImages((prev) => [
              ...prev,
              {
                url: result.data.url,
                public_id: result.data.public_id,
                is_primary: prev.length === 0,
              },
            ]);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Failed to upload image",
            );
          }
        };
        reader.readAsDataURL(file);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadImage],
  );

  const handleRemoveImage = useCallback(
    async (publicId: string) => {
      try {
        await deleteImage.mutateAsync(publicId);
        setImages((prev) => {
          const filtered = prev.filter((img) => img.public_id !== publicId);
          if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
            filtered[0].is_primary = true;
          }
          return filtered;
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete image",
        );
      }
    },
    [deleteImage],
  );

  const handleSetPrimary = useCallback((publicId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.public_id === publicId,
      })),
    );
  }, []);

  const handleGenerateDescription = useCallback(async () => {
    const name = getValues("name");
    if (!name) {
      toast.error("Enter a product name first");
      return;
    }
    setAiGenerating("description");
    try {
      const categoryId = getValues("category_id");
      const category = categories.find((c) => c.id === categoryId);
      const result = await fetchApi<{
        data: { description: string };
      }>("/api/admin/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: category?.name ?? null,
          material: getValues("material") || null,
          price: getValues("price") || null,
          weight: getValues("weight") || null,
        }),
      });
      setValue("description", result.data.description, { shouldDirty: true });
      toast.success("Description generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate description");
    } finally {
      setAiGenerating(null);
    }
  }, [getValues, setValue, categories]);

  const handleSuggestCategory = useCallback(async () => {
    const name = getValues("name");
    if (!name) {
      toast.error("Enter a product name first");
      return;
    }
    setAiGenerating("category");
    try {
      const result = await fetchApi<{
        data: { suggested_category: string | null; suggested_material: string | null };
      }>("/api/admin/ai/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: getValues("description") || null,
        }),
      });
      if (result.data.suggested_category) {
        const match = categories.find(
          (c) => c.name.toLowerCase() === result.data.suggested_category!.toLowerCase(),
        );
        if (match) {
          setValue("category_id", match.id, { shouldDirty: true });
          toast.success(`Category set to "${match.name}"`);
        } else {
          toast.info(`AI suggested "${result.data.suggested_category}" but no matching category found`);
        }
      }
      if (result.data.suggested_material) {
        setValue("material", result.data.suggested_material, { shouldDirty: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suggest category");
    } finally {
      setAiGenerating(null);
    }
  }, [getValues, setValue, categories]);

  const onFormSubmit = handleSubmit((data) => {
    onSubmit({
      ...data,
      price: Number(data.price),
      compare_price: data.compare_price ? Number(data.compare_price) : null,
      stock: Number(data.stock),
      is_featured: data.is_featured ?? false,
      images: images.length > 0 ? images : undefined,
    });
  });

  return (
    <form onSubmit={onFormSubmit}>
      <FieldGroup className="gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Product Name *</FieldLabel>
            <Input
              id="name"
              placeholder="e.g. Diamond Ring"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name && <FieldError id="name-error">{errors.name.message}</FieldError>}
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Category</FieldLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSuggestCategory}
                disabled={aiGenerating === "category"}
                className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-primary"
              >
                {aiGenerating === "category" ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 size-3" />
                )}
                Suggest
              </Button>
            </div>
            <Controller
              control={control}
              name="category_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || null)}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.category_id} aria-describedby={errors.category_id ? "category_id-error" : undefined}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category_id && (
              <FieldError id="category_id-error">{errors.category_id.message}</FieldError>
            )}
          </Field>
        </div>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateDescription}
              disabled={aiGenerating === "description"}
              className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-primary"
            >
              {aiGenerating === "description" ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <Sparkles className="mr-1 size-3" />
              )}
              Generate
            </Button>
          </div>
          <Textarea
            id="description"
            placeholder="Describe the product..."
            rows={3}
            {...register("description")}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="price">Price (INR) *</FieldLabel>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? "price-error" : undefined}
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && <FieldError id="price-error">{errors.price.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="compare_price">Compare Price (INR)</FieldLabel>
            <Input
              id="compare_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("compare_price", { valueAsNumber: true })}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="stock">Stock *</FieldLabel>
            <Input
              id="stock"
              type="number"
              min="0"
              placeholder="0"
              aria-invalid={!!errors.stock}
              aria-describedby={errors.stock ? "stock-error" : undefined}
              {...register("stock", { valueAsNumber: true })}
            />
            {errors.stock && <FieldError id="stock-error">{errors.stock.message}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="material">Material</FieldLabel>
            <Input
              id="material"
              placeholder="e.g. Gold, Silver, Platinum"
              {...register("material")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="weight">Weight</FieldLabel>
            <Input
              id="weight"
              placeholder="e.g. 5g, 10g"
              {...register("weight")}
            />
          </Field>
        </div>

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
          <FieldLabel htmlFor="is_active">Active (visible to customers)</FieldLabel>
        </Field>

        <Field>
          <FieldLabel>Product Images</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div
                key={img.public_id}
                className="group relative size-20 rounded-md border overflow-hidden"
              >
                <CloudinaryImage
                  src={img.url}
                  alt="Product"
                  width={80}
                  height={80}
                  crop="fill"
                  className="object-cover"
                />
                {img.is_primary && (
                  <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-px">
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {!img.is_primary && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-xs"
                      onClick={() => handleSetPrimary(img.public_id)}
                      title="Set as primary"
                    >
                      P
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={() => handleRemoveImage(img.public_id)}
                    title="Remove"
                  >
                    <X />
                  </Button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImage.isPending}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {uploadImage.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              <span className="text-[10px]">Upload</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
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
