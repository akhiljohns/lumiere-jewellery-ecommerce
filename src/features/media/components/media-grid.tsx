"use client";

import { useState } from "react";
import { Trash2, Check, Eye, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Media } from "../types";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaGridProps {
  items: Media[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (media: Media) => void;
  onDelete?: (media: Media) => void;
  view?: "grid" | "list";
}

export function MediaGrid({
  items,
  selectable,
  selectedIds,
  onToggleSelect,
  onDelete,
  view = "grid",
}: MediaGridProps) {
  const [infoMedia, setInfoMedia] = useState<Media | null>(null);

  if (view === "list") {
    return (
      <>
        <div className="divide-y divide-border rounded-lg border">
          {items.map((media) => {
            const isSelected = selectedIds?.has(media.id);
            return (
              <div
                key={media.id}
                className={`flex items-center gap-3 p-2 transition-colors hover:bg-muted/50 ${
                  selectable ? "cursor-pointer" : ""
                } ${isSelected ? "bg-primary/5" : ""}`}
                onClick={() => selectable && onToggleSelect?.(media)}
              >
                {selectable && (
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    }`}
                  >
                    {isSelected && <Check className="size-3" />}
                  </div>
                )}
                <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  <CloudinaryImage
                    src={media.url}
                    alt={media.alt_text || media.filename}
                    width={40}
                    height={40}
                    crop="fill"
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium text-foreground">
                    {media.filename}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(media.size_bytes)}
                    {media.width && media.height
                      ? ` · ${media.width}x${media.height}`
                      : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Popover open={infoMedia?.id === media.id} onOpenChange={(open) => setInfoMedia(open ? media : null)}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoMedia(infoMedia?.id === media.id ? null : media);
                          }}
                          title="View details"
                        />
                      }
                    >
                      <Eye className="size-3" />
                    </PopoverTrigger>
                    <PopoverContent side="left" className="w-72">
                      <MediaInfoCard media={media} />
                    </PopoverContent>
                  </Popover>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(media);
                      }}
                      title="Delete"
                      className="text-destructive/60 hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // Grid view
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
            onClick={() => selectable && onToggleSelect?.(media)}
          >
            <CloudinaryImage
              src={media.url}
              alt={media.alt_text || media.filename}
              width={200}
              height={200}
              crop="fill"
              className="size-full object-cover"
            />

            {/* Selection checkbox */}
            {selectable && (
              <div
                className={`absolute left-2 top-2 flex size-5 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-background/60 bg-background/60 opacity-0 group-hover:opacity-100"
                }`}
              >
                {isSelected && <Check className="size-3" />}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="truncate text-xs font-medium text-foreground">
                {media.filename}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {formatBytes(media.size_bytes)}
                </span>
                <div className="flex gap-1">
                  <Popover open={infoMedia?.id === media.id} onOpenChange={(open) => setInfoMedia(open ? media : null)}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="secondary"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoMedia(infoMedia?.id === media.id ? null : media);
                          }}
                          title="View details"
                        />
                      }
                    >
                      <Eye className="size-3" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-72">
                      <MediaInfoCard media={media} />
                    </PopoverContent>
                  </Popover>
                  {onDelete && (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MediaInfoCard({ media }: { media: Media }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-md bg-muted">
        <CloudinaryImage
          src={media.url}
          alt={media.alt_text || media.filename}
          width={260}
          height={180}
          crop="fill"
          className="w-full object-cover"
        />
      </div>
      <div className="space-y-1.5 text-xs">
        <InfoRow label="Name" value={media.filename} />
        {media.alt_text && <InfoRow label="Alt text" value={media.alt_text} />}
        <InfoRow label="Size" value={formatBytes(media.size_bytes)} />
        {media.width && media.height && (
          <InfoRow label="Dimensions" value={`${media.width} x ${media.height}px`} />
        )}
        {media.mime_type && <InfoRow label="Type" value={media.mime_type} />}
        <InfoRow
          label="Uploaded"
          value={new Date(media.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        />
        <div className="flex gap-1.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 flex-1 text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(media.url);
              toast.success("URL copied to clipboard");
            }}
          >
            <Copy className="size-3" />
            Copy URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              window.open(media.url, "_blank");
            }}
          >
            <ExternalLink className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export function MediaGridSkeleton({
  count = 12,
  view = "grid",
}: {
  count?: number;
  view?: "grid" | "list";
}) {
  if (view === "list") {
    return (
      <div className="divide-y divide-border rounded-lg border">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="size-10 shrink-0 animate-pulse rounded-md bg-muted" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-2 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}
