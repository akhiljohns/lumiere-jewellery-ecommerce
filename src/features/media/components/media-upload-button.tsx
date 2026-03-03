"use client";

import { useRef, useCallback, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUploadMedia } from "../api/upload-media";

interface MediaUploadButtonProps {
  onUploaded?: () => void;
}

export function MediaUploadButton({ onUploaded }: MediaUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadMedia();
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          setUploadingCount((c) => c + 1);
          try {
            await uploadMedia.mutateAsync({
              file: base64,
              filename: file.name,
            });
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Failed to upload image",
            );
          } finally {
            setUploadingCount((c) => c - 1);
            onUploaded?.();
          }
        };
        reader.readAsDataURL(file);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadMedia, onUploaded],
  );

  const isUploading = uploadingCount > 0;

  return (
    <>
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {isUploading ? `Uploading (${uploadingCount})...` : "Upload"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
