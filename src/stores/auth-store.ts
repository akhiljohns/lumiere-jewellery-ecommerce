import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SUPER_ADMIN_ROLE } from "@/lib/permissions";
import type { SafeUser } from "@/features/auth/services/auth-service";

interface AuthState {
  user: SafeUser | null;
  permissions: string[];
  setAuth: (user: SafeUser, permissions: string[]) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],

      setAuth: (user, permissions) => set({ user, permissions }),

      clearAuth: () => set({ user: null, permissions: [] }),

      hasPermission: (permission) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.role === SUPER_ADMIN_ROLE) return true;
        return permissions.includes(permission);
      },

      hasAnyPermission: (perms) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.role === SUPER_ADMIN_ROLE) return true;
        return perms.some((p) => permissions.includes(p));
      },
    }),
    {
      name: "admin-auth",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
