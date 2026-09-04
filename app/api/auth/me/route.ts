import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }
  return NextResponse.json({
    email: session.email,
    role: session.role,
    mustChangePassword: session.mustChangePassword,
  });
}
