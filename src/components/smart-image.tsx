"use client";

import { CloudinaryImage, type CloudinaryImageProps } from "@/components/cloudinary-image";

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

type SmartImageProps = Omit<CloudinaryImageProps, "crop"> & {
  crop?: CloudinaryImageProps["crop"];
};

/**
 * Smart image component that detects Cloudinary vs non-Cloudinary URLs.
 * - Cloudinary URLs → delegates to <CloudinaryImage> (CldImage with optimizations)
 * - Other URLs → renders a standard <img> with same className/dimensions
 */
export function SmartImage({ src, alt, className, width, height, fill, crop, sizes, ...props }: SmartImageProps) {
  if (isCloudinaryUrl(src)) {
    return (
      <CloudinaryImage
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        fill={fill}
        crop={crop}
        sizes={sizes}
        {...props}
      />
    );
  }

  // For non-Cloudinary URLs, render a standard <img> tag
  const imgStyle: React.CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={className}
      width={!fill && typeof width === "number" ? width : undefined}
      height={!fill && typeof height === "number" ? height : undefined}
      style={imgStyle}
      loading="lazy"
    />
  );
}
