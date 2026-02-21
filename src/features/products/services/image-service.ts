import { createAdminClient } from "@/lib/supabase/admin";
import {
  uploadImage as cloudinaryUpload,
  deleteImage as cloudinaryDelete,
} from "@/lib/cloudinary";

/**
 * Upload an image to Cloudinary through the server.
 * Accepts a base64 data URI or a remote URL.
 */
export async function uploadProductImage(file: string) {
  return cloudinaryUpload(file, "jewellery-ecommerce/products");
}

/**
 * Delete an image from Cloudinary by public_id.
 */
export async function deleteProductImage(publicId: string) {
  return cloudinaryDelete(publicId);
}

/**
 * Set a specific image as the primary for a product.
 * Unsets all other images' `is_primary` first.
 */
export async function setPrimaryImage(
  productId: string,
  imageId: string,
): Promise<void> {
  const supabase = createAdminClient();

  // Unset all primaries for this product
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  // Set the target image as primary
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) throw new Error(error.message);
}

/**
 * Delete a product image record and its Cloudinary asset.
 */
export async function deleteProductImageRecord(imageId: string): Promise<void> {
  const supabase = createAdminClient();

  // Get the public_id first
  const { data: image, error: fetchError } = await supabase
    .from("product_images")
    .select("public_id")
    .eq("id", imageId)
    .single();

  if (fetchError || !image) throw new Error("Image not found");

  // Delete from Cloudinary
  await cloudinaryDelete(image.public_id);

  // Delete from database
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw new Error(error.message);
}
