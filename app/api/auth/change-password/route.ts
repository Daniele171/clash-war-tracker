import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getSession, createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { updateUserPassword } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'La password deve essere di almeno 6 caratteri' }, { status: 400 });
    }

    const ok = await updateUserPassword(session.email, newPassword);
    if (!ok) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Issue new token without mustChangePassword flag
    const newToken = await createSessionToken({
      ...session,
      mustChangePassword: false,
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set(sessionCookieOptions(newToken));
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
