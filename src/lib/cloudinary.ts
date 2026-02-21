import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Upload a base64 or URL image to Cloudinary.
 */
export async function uploadImage(
  file: string,
  folder = "jewellery-ecommerce/products",
) {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1200, height: 1200, crop: "limit", quality: "auto" },
    ],
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}

/**
 * Delete an image from Cloudinary by its public_id.
 */
export async function deleteImage(publicId: string) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
}
