import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request);
  
  if (!auth.authorized) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Redirect to login page if unauthorized
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect dashboard and api routes (except auth endpoints)
    '/dashboard/:path*',
    '/api/((?!auth|sync).*)', // Note: /api/sync is excluded because it's called by cron (uses CRON_SECRET)
  ],
};
