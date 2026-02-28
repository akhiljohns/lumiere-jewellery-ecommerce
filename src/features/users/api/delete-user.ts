import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { adminUser } from "@/lib/api-routes";
import { USERS_QUERY_KEY } from "./get-users";

async function deleteUser(id: string) {
  return fetchApi(adminUser(id), {
    method: "DELETE",
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}
