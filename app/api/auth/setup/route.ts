import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createUser, getUsers } from '@/lib/users';

// One-time setup endpoint protected by CRON_SECRET
// POST /api/auth/setup with Authorization: Bearer <CRON_SECRET>
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { email, password, role } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password obbligatorie' }, { status: 400 });
    }

    const user = await createUser(email, password, role || 'admin', false);
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET: check if any admin exists
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const users = await getUsers();
  return NextResponse.json({ count: users.length, hasAdmin: users.some(u => u.role === 'admin') });
}
