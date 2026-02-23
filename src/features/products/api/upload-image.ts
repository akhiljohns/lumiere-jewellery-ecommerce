import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface UploadResult {
  data: { url: string; public_id: string };
  message: string;
}

async function uploadImage(file: string): Promise<UploadResult> {
  return fetchApi<UploadResult>("/api/upload/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file }),
  });
}

async function deleteImage(publicId: string) {
  return fetchApi("/api/upload/image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_id: publicId }),
  });
}

export function useUploadImage() {
  return useMutation({ mutationFn: uploadImage });
}

export function useDeleteImage() {
  return useMutation({ mutationFn: deleteImage });
}
