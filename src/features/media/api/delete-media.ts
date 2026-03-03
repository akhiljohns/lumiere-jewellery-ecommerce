import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { adminMedia } from "@/lib/api-routes";

async function deleteMedia(id: string) {
  return fetchApi(adminMedia(id), { method: "DELETE" });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });
}
