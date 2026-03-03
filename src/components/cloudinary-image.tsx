"use client";

import { CldImage, type CldImageProps } from "next-cloudinary";

/**
 * Extract the Cloudinary public_id from a full secure_url.
 * e.g. "https://res.cloudinary.com/xxx/image/upload/v123/folder/file.jpg"
 *    → "folder/file"
 *
 * Falls back to returning the input as-is (already a public_id).
 */
export function extractPublicId(urlOrId: string): string {
  const match = urlOrId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
  return match?.[1] ?? urlOrId;
}

export type CloudinaryImageProps = Omit<CldImageProps, "src"> & {
  /** Cloudinary URL or public_id */
  src: string;
};

/**
 * Wrapper around next-cloudinary CldImage with project defaults:
 * - Auto format (WebP/AVIF) and quality
 * - Lazy loading
 * - Extracts public_id from full Cloudinary URLs
 */
export function CloudinaryImage({ src, ...props }: CloudinaryImageProps) {
  return <CldImage src={extractPublicId(src)} loading="lazy" {...props} />;
}
