import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/users';
import { sendOTP } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Security: don't reveal if email exists or not
      // But still return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Admin uses password, not OTP
    if (user.role === 'admin') {
      return NextResponse.json({ needsPassword: true });
    }

    const sent = await sendOTP(email);
    if (!sent) {
      return NextResponse.json({ error: 'Errore durante invio email. Riprova.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, needsOTP: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
