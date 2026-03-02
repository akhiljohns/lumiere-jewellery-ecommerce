"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/supabase/types";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const mainImageRef = useRef<HTMLDivElement>(null);

  const currentImage = images[selectedIndex];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!mainImageRef.current) return;
    const touch = e.touches[0];
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        ref={mainImageRef}
        className="relative aspect-square cursor-crosshair overflow-hidden rounded-lg bg-muted"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsZooming(true)}
        onTouchEnd={() => setIsZooming(false)}
        onTouchMove={handleTouchMove}
      >
        <AnimatePresence mode="wait">
          {currentImage && (
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <CloudinaryImage
                src={currentImage.url}
                alt={`${productName} - Image ${selectedIndex + 1}`}
                fill
                crop="fill"
                sizes="(max-width: 768px) 100vw, 50vw"
                className={cn(
                  "object-cover transition-transform duration-200",
                  isZooming && "scale-150",
                )}
                style={
                  isZooming
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                i === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <CloudinaryImage
                src={image.url}
                alt={`${productName} thumbnail ${i + 1}`}
                width={64}
                height={64}
                crop="fill"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
