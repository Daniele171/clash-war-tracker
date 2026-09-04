import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/users';
import { verifyOTP } from '@/lib/email';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, otp } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    // --- Admin: password login ---
    if (user.role === 'admin') {
      if (!password) {
        return NextResponse.json({ error: 'Password obbligatoria per gli admin' }, { status: 400 });
      }
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
      }
    } else {
      // --- Member: OTP login ---
      if (!otp) {
        return NextResponse.json({ error: 'Codice OTP obbligatorio' }, { status: 400 });
      }
      const valid = await verifyOTP(email, otp);
      if (!valid) {
        return NextResponse.json({ error: 'Codice non valido o scaduto' }, { status: 401 });
      }
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
