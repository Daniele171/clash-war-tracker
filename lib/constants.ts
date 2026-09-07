export const MASTER_ADMIN_EMAIL = 'grazioso.daniele7@gmail.com';

export const PERMISSIONS_KEY = 'cwt:settings:permissions';
export const TELEGRAM_SETTINGS_KEY = 'cwt:settings:telegram';

export interface AppPermissions {
  adminCanCreateUser: boolean;
  adminCanDeleteUser: boolean;
  adminCanExcuse: boolean;
  adminCanForceSync: boolean;
  adminCanChangeRole: boolean;
}

export const DEFAULT_PERMISSIONS: AppPermissions = {
  adminCanCreateUser: false,
  adminCanDeleteUser: false,
  adminCanExcuse: true,
  adminCanForceSync: true,
  adminCanChangeRole: false,
};

export type PermissionKey = keyof AppPermissions;
export type UserRole = 'admin' | 'member' | 'viewer';
