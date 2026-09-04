import { NextRequest } from 'next/server';

export interface AuthSession {
  authorized: boolean;
  user: any | null;
  error?: string;
}

/**
 * ABSTRACTION LAYER FOR AUTHENTICATION
 * Currently this is a passthrough (returns authorized = true).
 * 
 * When you want to add NextAuth, Clerk, or basic auth:
 * 1. Modify this single function
 * 2. Return { authorized: false } for unauthorized users
 * 3. The middleware and API routes will automatically protect everything
 */
export async function requireAuth(req?: NextRequest): Promise<AuthSession> {
  // TODO: Add actual authentication here later
  return { authorized: true, user: { role: 'admin' } };
}
