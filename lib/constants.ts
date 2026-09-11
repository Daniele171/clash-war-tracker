export const MASTER_ADMIN_EMAIL = 'grazioso.daniele7@gmail.com';

export const PERMISSIONS_KEY = 'cwt:settings:permissions';
export const TELEGRAM_SETTINGS_KEY = 'cwt:settings:telegram';

export interface AppPermissions {
  adminCanCreateUser: boolean;
  adminCanDeleteUser: boolean;
  adminCanExcuse: boolean;
  adminCanForceSync: boolean;
  adminCanChangeRole: boolean;
  adminCanConfigureBot: boolean;
  adminCanClearCache: boolean;
  adminCanSendManualAlerts: boolean;
  adminCanManageGlobalSettings: boolean;
}

export const DEFAULT_PERMISSIONS: AppPermissions = {
  adminCanCreateUser: false,
  adminCanDeleteUser: false,
  adminCanExcuse: true,
  adminCanForceSync: true,
  adminCanChangeRole: false,
  adminCanConfigureBot: false,
  adminCanClearCache: false,
  adminCanSendManualAlerts: false,
  adminCanManageGlobalSettings: false,
};

export type PermissionKey = keyof AppPermissions;
export type UserRole = 'admin' | 'member' | 'viewer';

export const GLOBAL_SETTINGS_KEY = 'cwt:settings:global';

export interface GlobalSettings {
  showLiveBanner: boolean;
  sortByDecksToday: boolean;
  hideZeroMedalsTraining: boolean;
  missedDecksWarningThreshold: number;
  hoursBeforeEndForWarning: number;
  compactMode: boolean;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  showLiveBanner: true,
  sortByDecksToday: false,
  hideZeroMedalsTraining: false,
  missedDecksWarningThreshold: 4,
  hoursBeforeEndForWarning: 2,
  compactMode: false,
};
