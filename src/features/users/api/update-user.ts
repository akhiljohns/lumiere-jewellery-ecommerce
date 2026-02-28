import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserUpdateInput } from "@/lib/validators";
import { fetchApi } from "@/lib/api-client";
import { adminUser } from "@/lib/api-routes";
import { USERS_QUERY_KEY } from "./get-users";
import { USER_QUERY_KEY } from "./get-user";

async function updateUser({
  id,
  data,
}: {
  id: string;
  data: UserUpdateInput;
}) {
  return fetchApi(adminUser(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [USER_QUERY_KEY, variables.id],
      });
    },
  });
}
