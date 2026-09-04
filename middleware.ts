import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const auth = await requireAuth(request);

  if (!auth.authorized) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Force password change for first-login users
  if (auth.user?.mustChangePassword && pathname !== '/change-password') {
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
    // Only allow change-password API call
    if (!pathname.startsWith('/api/auth/change-password')) {
      return NextResponse.json({ error: 'Devi cambiare la password' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/change-password',
    '/api/((?!auth|sync).*)',  // /api/sync is called by cron with CRON_SECRET
  ],
};
