import { useAuthStore } from "@/stores/auth-store";
import { SUPER_ADMIN_ROLE } from "@/lib/permissions";

export function usePermissions() {
  const { permissions, user, hasPermission, hasAnyPermission } = useAuthStore();

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    canView: (resource: string) => hasPermission(`${resource}.view`),
    canCreate: (resource: string) => hasPermission(`${resource}.create`),
    canEdit: (resource: string) => hasPermission(`${resource}.edit`),
    canDelete: (resource: string) => hasPermission(`${resource}.delete`),
    isSuperAdmin: user?.role === SUPER_ADMIN_ROLE,
  };
}
