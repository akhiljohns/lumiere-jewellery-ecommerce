import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_MEDIA } from "@/lib/api-routes";
import type { Media } from "../types";

interface UploadMediaInput {
  file: string;
  filename?: string;
  alt_text?: string;
}

async function uploadMedia(input: UploadMediaInput): Promise<{ data: Media; message: string }> {
  return fetchApi(`${ADMIN_MEDIA}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });
}
