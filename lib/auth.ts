import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'cwt_session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  mustChangePassword: boolean;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'admin' | 'viewer',
      mustChangePassword: payload.mustChangePassword as boolean,
    };
  } catch {
    return null;
  }
}

export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION,
    path: '/',
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}

// Used by middleware
export async function requireAuth(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return { authorized: false, user: null };
  return { authorized: true, user };
}
