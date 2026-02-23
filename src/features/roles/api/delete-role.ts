import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { ROLES_QUERY_KEY } from "./get-roles";

async function deleteRole(id: string) {
  return fetchApi(`/api/admin/roles/${id}`, { method: "DELETE" });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
    },
  });
}
