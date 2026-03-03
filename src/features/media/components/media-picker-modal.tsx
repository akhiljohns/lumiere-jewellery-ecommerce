"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "./media-grid";
import { MediaUploadButton } from "./media-upload-button";
import { useGetMedia } from "../api/get-media";
import type { Media } from "../types";

interface MediaPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: Media) => void;
}

export function MediaPickerModal({
  open,
  onOpenChange,
  onSelect,
}: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetMedia({
    page,
    limit: 18,
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

  const media = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <MediaUploadButton />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="text-sm">No media found</p>
              <p className="text-xs">Upload images to get started</p>
            </div>
          ) : (
            <MediaGrid
              items={media}
              selectable
              onSelect={(m) => {
                onSelect(m);
                onOpenChange(false);
              }}
            />
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
