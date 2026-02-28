import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_ROLES } from "@/lib/api-routes";
import { ROLES_QUERY_KEY } from "./get-roles";

export interface RoleCreateInput {
  name: string;
  description?: string | null;
  permissions: string[];
}

async function createRole(data: RoleCreateInput) {
  return fetchApi(ADMIN_ROLES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
    },
  });
}
