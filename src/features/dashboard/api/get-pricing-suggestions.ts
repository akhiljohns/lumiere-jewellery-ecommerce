import { useQuery } from "@tanstack/react-query";
import type { PricingSuggestionsResponse } from "@/features/dashboard/services/pricing-suggestions-service";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_PRICING_SUGGESTIONS } from "@/lib/api-routes";

async function fetchPricingSuggestions(): Promise<{ data: PricingSuggestionsResponse }> {
  return fetchApi<{ data: PricingSuggestionsResponse }>(ADMIN_PRICING_SUGGESTIONS);
}

export function useGetPricingSuggestions() {
  return useQuery({
    queryKey: ["pricing-suggestions"],
    queryFn: fetchPricingSuggestions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
