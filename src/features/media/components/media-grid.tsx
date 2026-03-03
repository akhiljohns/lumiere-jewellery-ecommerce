"use client";

import { Trash2, Check } from "lucide-react";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { Button } from "@/components/ui/button";
import type { Media } from "../types";

interface MediaGridProps {
  items: Media[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (media: Media) => void;
  onDelete?: (media: Media) => void;
}

export function MediaGrid({
  items,
  selectable,
  selectedIds,
  onSelect,
  onDelete,
}: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((media) => {
        const isSelected = selectedIds?.has(media.id);
        return (
          <div
            key={media.id}
            className={`group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all ${
              selectable ? "cursor-pointer" : ""
            } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
            onClick={() => selectable && onSelect?.(media)}
          >
            <CloudinaryImage
              src={media.url}
              alt={media.alt_text || media.filename}
              width={200}
              height={200}
              crop="fill"
              className="size-full object-cover"
            />

            {/* Selection indicator */}
            {selectable && isSelected && (
              <div className="absolute left-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </div>
            )}

            {/* Hover overlay with actions */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="truncate text-xs font-medium text-foreground">
                {media.filename}
              </p>
              {onDelete && (
                <div className="mt-1 flex justify-end">
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(media);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
