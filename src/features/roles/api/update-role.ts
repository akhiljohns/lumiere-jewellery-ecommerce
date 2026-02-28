import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { adminRole } from "@/lib/api-routes";
import { ROLES_QUERY_KEY } from "./get-roles";
import { ROLE_QUERY_KEY } from "./get-role";

export interface RoleUpdateInput {
  name?: string;
  description?: string | null;
  permissions?: string[];
}

async function updateRole({ id, data }: { id: string; data: RoleUpdateInput }) {
  return fetchApi(adminRole(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRole,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY, variables.id] });
    },
  });
}
