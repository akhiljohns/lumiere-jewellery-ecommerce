"use client";

import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaUploadButton } from "@/features/media/components/media-upload-button";
import { useGetMedia } from "@/features/media/api/get-media";
import { useDeleteMedia } from "@/features/media/api/delete-media";
import type { Media } from "@/features/media/types";

export default function MediaPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);

  const { data, isLoading } = useGetMedia({
    page,
    limit: 24,
    search: debouncedSearch || undefined,
  });

  const deleteMedia = useDeleteMedia();

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      return () => clearTimeout(timeout);
    },
    [setSearch, setPage],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMedia.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`"${deleteTarget.filename}" deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }, [deleteTarget, deleteMedia]);

  const media = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 1,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Media Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage uploaded images
          </p>
        </div>
        <MediaUploadButton />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by filename..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

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
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <p className="text-sm">No media found</p>
          <p className="text-xs">Upload images to get started</p>
        </div>
      ) : (
        <MediaGrid
          items={media}
          onDelete={(m) => setDeleteTarget(m)}
        />
      )}

      {pagination.total > 0 && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="px-2 tabular-nums">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Media"
        description={`Are you sure you want to delete "${deleteTarget?.filename}"? This will remove it from Cloudinary permanently.`}
        onConfirm={handleDelete}
        loading={deleteMedia.isPending}
        destructive
      />
    </div>
  );
}
