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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [USERS_QUERY_KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [USERS_QUERY_KEY] });
      queryClient.setQueriesData(
        { queryKey: [USERS_QUERY_KEY] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.filter((u: { id: string }) => u.id !== id) };
        },
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}
