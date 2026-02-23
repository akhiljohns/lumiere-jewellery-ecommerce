export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  permissions: string[];
}

export interface PaginatedRoles {
  data: RoleWithPermissions[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
