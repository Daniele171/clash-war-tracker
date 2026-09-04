import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUsers, createUser, deleteUser, resetUserPassword } from '@/lib/users';

// GET /api/auth/users — list all users (admin only)
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }
  const users = await getUsers();
  return NextResponse.json(users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    mustChangePassword: u.mustChangePassword,
    createdAt: u.createdAt,
  })));
}

// POST /api/auth/users — create user (admin only)
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }
  try {
    const { email, password, role } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password obbligatorie' }, { status: 400 });
    }
    const user = await createUser(email, password, role || 'viewer', true);
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/auth/users — delete user (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }
  try {
    const { email } = await request.json();
    if (email === session.email) {
      return NextResponse.json({ error: 'Non puoi eliminare il tuo account' }, { status: 400 });
    }
    const ok = await deleteUser(email);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/auth/users — reset password (admin only)
export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }
  try {
    const { email, newPassword } = await request.json();
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email e nuova password obbligatorie' }, { status: 400 });
    }
    const ok = await resetUserPassword(email, newPassword);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
