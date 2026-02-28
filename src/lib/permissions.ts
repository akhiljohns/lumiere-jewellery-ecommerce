export const RESOURCES = ["product", "category", "user", "dashboard"] as const;
export const ACTIONS = ["view", "create", "edit", "delete"] as const;

export const PERMISSIONS = {
  product: {
    view: "product.view",
    create: "product.create",
    edit: "product.edit",
    delete: "product.delete",
  },
  category: {
    view: "category.view",
    create: "category.create",
    edit: "category.edit",
    delete: "category.delete",
  },
  user: {
    view: "user.view",
    create: "user.create",
    edit: "user.edit",
    delete: "user.delete",
  },
  dashboard: {
    view: "dashboard.view",
  },
} as const;

export type Permission =
  | "product.view"
  | "product.create"
  | "product.edit"
  | "product.delete"
  | "category.view"
  | "category.create"
  | "category.edit"
  | "category.delete"
  | "user.view"
  | "user.create"
  | "user.edit"
  | "user.delete"
  | "dashboard.view";

export const ALL_PERMISSIONS: Permission[] = [
  "product.view",
  "product.create",
  "product.edit",
  "product.delete",
  "category.view",
  "category.create",
  "category.edit",
  "category.delete",
  "user.view",
  "user.create",
  "user.edit",
  "user.delete",
  "dashboard.view",
];

export const SUPER_ADMIN_ROLE = "super_admin";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  product_manager: [
    "product.view",
    "product.create",
    "product.edit",
    "product.delete",
    "category.view",
    "category.create",
    "category.edit",
    "category.delete",
    "dashboard.view",
  ],
  viewer: [
    "product.view",
    "category.view",
    "user.view",
    "dashboard.view",
  ],
};

/**
 * Numeric rank for each known role.
 * A user can only edit roles whose rank is strictly less than their own.
 * Custom / unknown roles receive rank 10.
 */
export const ROLE_RANK: Record<string, number> = {
  super_admin: 100,
  admin: 80,
  product_manager: 50,
  viewer: 20,
};

export function getRoleRank(role: string): number {
  return ROLE_RANK[role] ?? 10;
}

/** Group permissions by resource for UI display (roles CRUD form) */
export const PERMISSIONS_BY_RESOURCE: Record<string, Permission[]> = {
  product: ["product.view", "product.create", "product.edit", "product.delete"],
  category: ["category.view", "category.create", "category.edit", "category.delete"],
  user: ["user.view", "user.create", "user.edit", "user.delete"],
  dashboard: ["dashboard.view"],
};
