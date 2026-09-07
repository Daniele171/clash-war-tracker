import { createClient } from '@/utils/supabase/server';
import { getJson } from '@/lib/db';
import { 
  MASTER_ADMIN_EMAIL, 
  PERMISSIONS_KEY, 
  DEFAULT_PERMISSIONS, 
  AppPermissions, 
  PermissionKey, 
  UserRole 
} from '@/lib/constants';
import type { User } from '@supabase/supabase-js';

export interface AuthContext {
  user: User;
  email: string;
  isMaster: boolean;
  role: UserRole;
  isAdmin: boolean;
  permissions: AppPermissions;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

/**
 * Returns current dynamic permissions merged with defaults
 */
export async function getMergedPermissions(): Promise<AppPermissions> {
  try {
    const custom = await getJson(PERMISSIONS_KEY);
    return { ...DEFAULT_PERMISSIONS, ...(custom || {}) };
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}

/**
 * Extracts and verifies the authenticated user session from Supabase SSR
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const email = user.email || '';
  const isMaster = email === MASTER_ADMIN_EMAIL;
  const role: UserRole = user.user_metadata?.role || 'viewer';
  const isAdmin = role === 'admin' || isMaster;
  const permissions = await getMergedPermissions();

  return {
    user,
    email,
    isMaster,
    role,
    isAdmin,
    permissions,
  };
}

/**
 * Requires user to be authenticated. Throws AuthError(401) if not.
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) {
    throw new AuthError('Non autenticato', 401);
  }
  return auth;
}

/**
 * Requires user to be Admin (or Master Admin). Throws AuthError(403) if not.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const auth = await requireAuth();
  if (!auth.isAdmin) {
    throw new AuthError('Accesso riservato agli amministratori', 403);
  }
  return auth;
}

/**
 * Requires user to be the Master Admin. Throws AuthError(403) if not.
 */
export async function requireMasterAdmin(): Promise<AuthContext> {
  const auth = await requireAuth();
  if (!auth.isMaster) {
    throw new AuthError('Operazione riservata esclusivamente al Master Admin', 403);
  }
  return auth;
}

/**
 * Requires either Master Admin OR an Admin with the specific permission enabled.
 */
export async function requirePermission(permission: PermissionKey): Promise<AuthContext> {
  const auth = await requireAuth();

  // Master Admin can do anything
  if (auth.isMaster) {
    return auth;
  }

  // Must be at least admin
  if (!auth.isAdmin) {
    throw new AuthError('Permesso negato: ruolo amministratore richiesto', 403);
  }

  // Check dynamic permissions
  if (!auth.permissions[permission]) {
    throw new AuthError(`Permesso negato dal Master Admin (${permission})`, 403);
  }

  return auth;
}

/**
 * Fail-closed verification for CRON jobs or external webhooks using Bearer token or secret param
 */
export function verifyCronSecret(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  // If CRON_SECRET is not configured or too short, fail closed!
  if (!configuredSecret || configuredSecret.trim().length === 0) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${configuredSecret}`) {
    return true;
  }

  try {
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    if (secretParam && secretParam === configuredSecret) {
      return true;
    }
  } catch {
    // Ignore URL parse error
  }

  return false;
}
