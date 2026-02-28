import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserCreateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_USERS } from "@/lib/api-routes";
import { USERS_QUERY_KEY } from "./get-users";

async function createUser(data: UserCreateInput) {
  return fetchApi(ADMIN_USERS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}
