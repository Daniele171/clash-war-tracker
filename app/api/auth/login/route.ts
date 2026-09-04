import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/users';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password obbligatorie' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    const res = NextResponse.json({
      success: true,
      mustChangePassword: user.mustChangePassword,
      role: user.role,
    });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
