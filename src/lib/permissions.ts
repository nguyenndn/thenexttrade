import { UserRole } from "@prisma/client";

// =============================================================================
// ROLE-BASED PERMISSION SYSTEM
// Hard-coded permission map for 3 roles: ADMIN, EDITOR, USER
// =============================================================================

export interface RolePermissions {
 canManageUsers: boolean;
 canCreateUsers: boolean;
 canDeleteUsers: boolean;
 canChangeRoles: boolean;
 canManageArticles: boolean;
 canManageAcademy: boolean;
 canManageEA: boolean;
 canManageSettings: boolean;
 canViewAnalytics: boolean;
 canManageTaxonomy: boolean;
 canManageComments: boolean;
 canManageMedia: boolean;
}

const PERMISSIONS: Record<UserRole, RolePermissions> = {
 ADMIN: {
 canManageUsers: true,
 canCreateUsers: true,
 canDeleteUsers: true,
 canChangeRoles: true,
 canManageArticles: true,
 canManageAcademy: true,
 canManageEA: true,
 canManageSettings: true,
 canViewAnalytics: true,
 canManageTaxonomy: true,
 canManageComments: true,
 canManageMedia: true,
 },
 EDITOR: {
 canManageUsers: false,
 canCreateUsers: false,
 canDeleteUsers: false,
 canChangeRoles: false,
 canManageArticles: true,
 canManageAcademy: true,
 canManageEA: false,
 canManageSettings: false,
 canViewAnalytics: true,
 canManageTaxonomy: true,
 canManageComments: true,
 canManageMedia: true,
 },
 USER: {
 canManageUsers: false,
 canCreateUsers: false,
 canDeleteUsers: false,
 canChangeRoles: false,
 canManageArticles: false,
 canManageAcademy: false,
 canManageEA: false,
 canManageSettings: false,
 canViewAnalytics: false,
 canManageTaxonomy: false,
 canManageComments: false,
 canManageMedia: false,
 },
};

export function getPermissions(role: UserRole | string): RolePermissions {
 return PERMISSIONS[role as UserRole] ?? PERMISSIONS.USER;
}

export function hasPermission(
 role: UserRole | string,
 permission: keyof RolePermissions
): boolean {
 return getPermissions(role)[permission];
}

export const ADMIN_ROLES: UserRole[] = ["ADMIN", "EDITOR"];

export function isAdminRole(role: string | undefined | null): boolean {
 return ADMIN_ROLES.includes(role as UserRole);
}
