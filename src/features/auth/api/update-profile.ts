import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { CUSTOMER_PROFILE } from "@/lib/api-routes";
import { CUSTOMER_PROFILE_QUERY_KEY } from "./get-profile";

interface ProfileUpdateInput {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

async function updateProfile(data: ProfileUpdateInput) {
  return fetchApi(CUSTOMER_PROFILE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CUSTOMER_PROFILE_QUERY_KEY],
      });
    },
  });
}
