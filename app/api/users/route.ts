import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

// Convert username to internal email format
function usernameToEmail(username: string): string {
  // Sanitize: lowercase, remove spaces, keep only alphanumerics and some safe chars
  const sanitized = username.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
  return `${sanitized}@clan.local`;
}

// Extract username from internal email
function emailToUsername(email: string): string {
  if (email.endsWith('@clan.local')) {
    return email.replace('@clan.local', '');
  }
  return email; // fallback for legacy accounts
}

// GET all users
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const adminAuthClient = createAdminClient()
  const { data, error } = await adminAuthClient.auth.admin.listUsers()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    username: u.user_metadata?.username || emailToUsername(u.email || ''),
    role: u.user_metadata?.role || 'viewer',
    createdAt: u.created_at
  }))

  return NextResponse.json(users)
}

// POST create user
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { password, role } = body
    // Support both 'username' (new) and 'email' (legacy) field
    const username = body.username || (body.email ? body.email.replace('@clan.local', '').replace(/@.*/, '') : null)

    if (!username || !password) {
      return NextResponse.json({ error: 'Username e Password sono obbligatori' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La password deve avere almeno 6 caratteri' }, { status: 400 })
    }

    const internalEmail = usernameToEmail(username)
    
    const adminAuthClient = createAdminClient()
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: internalEmail,
      password: password,
      email_confirm: true, // Skip email verification
      user_metadata: { 
        username: username, // Store the original display name
        role: role || 'viewer',
        must_change_password: true // Force password change on first login
      }
    })

    if (error) throw error

    return NextResponse.json({ success: true, user: data.user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// DELETE user
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  try {
    const { id } = await request.json()
    if (id === user.id) {
      return NextResponse.json({ error: 'Non puoi eliminare te stesso' }, { status: 400 })
    }

    const adminAuthClient = createAdminClient()
    const { error } = await adminAuthClient.auth.admin.deleteUser(id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
