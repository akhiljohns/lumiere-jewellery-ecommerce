import { useQuery } from "@tanstack/react-query";
import type { InventoryAlertsResponse } from "@/features/dashboard/services/inventory-alerts-service";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_INVENTORY_ALERTS } from "@/lib/api-routes";

async function fetchInventoryAlerts(): Promise<{ data: InventoryAlertsResponse }> {
  return fetchApi<{ data: InventoryAlertsResponse }>(ADMIN_INVENTORY_ALERTS);
}

export function useGetInventoryAlerts() {
  return useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: fetchInventoryAlerts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
