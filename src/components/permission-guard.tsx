"use client";

import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

export function CanView({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permission={`${resource}.view`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanCreate({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permission={`${resource}.create`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanEdit({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permission={`${resource}.edit`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanDelete({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permission={`${resource}.delete`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
