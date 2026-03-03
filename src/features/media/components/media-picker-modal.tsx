"use client";

import { useState, useCallback } from "react";
import { Search, Grid3X3, List, ImageIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaGrid, MediaGridSkeleton } from "./media-grid";
import { MediaUploadButton } from "./media-upload-button";
import { useGetMedia } from "../api/get-media";
import type { Media } from "../types";

interface MediaPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: Media[]) => void;
}

export function MediaPickerModal({
  open,
  onOpenChange,
  onSelect,
}: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedMap, setSelectedMap] = useState<Map<string, Media>>(new Map());

  const { data, isLoading } = useGetMedia({
    page,
    limit: 24,
    search: debouncedSearch || undefined,
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  const handleToggleSelect = useCallback((media: Media) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(media.id)) {
        next.delete(media.id);
      } else {
        next.set(media.id, media);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect(Array.from(selectedMap.values()));
    setSelectedMap(new Map());
    onOpenChange(false);
  }, [selectedMap, onSelect, onOpenChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setSelectedMap(new Map());
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const media = data?.data ?? [];
  const pagination = data?.pagination;
  const selectedIds = new Set(selectedMap.keys());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[75vw] max-w-5xl sm:max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-4" />
            Select from Media Library
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or alt text..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center rounded-md border">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setView("grid")}
              title="Grid view"
              className="rounded-r-none"
            >
              <Grid3X3 className="size-3.5" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setView("list")}
              title="List view"
              className="rounded-l-none"
            >
              <List className="size-3.5" />
            </Button>
          </div>
          <MediaUploadButton />
        </div>

        {/* Media content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <MediaGridSkeleton count={12} view={view} />
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ImageIcon className="mb-2 size-8 opacity-40" />
              <p className="text-sm">No media found</p>
              <p className="text-xs">Upload images to get started</p>
            </div>
          ) : (
            <MediaGrid
              items={media}
              selectable
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              view={view}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between border-t pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <span className="tabular-nums">
                  {pagination.page}/{pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
            {pagination && (
              <span>{pagination.total} total</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedMap.size > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {selectedMap.size} selected
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={selectedMap.size === 0}
            >
              Add Selected ({selectedMap.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
